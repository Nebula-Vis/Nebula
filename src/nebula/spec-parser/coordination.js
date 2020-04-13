import ReactiveProperty from '../reactive-prop'

export default class CoordinationSpecParser {
  constructor(
    dataSources,
    visualizationsManager,
    transformationsManager,
    spec
  ) {
    this._dataSources = dataSources
    this._visualizationsManager = visualizationsManager
    this._transformationsManager = transformationsManager
    this._spec = spec

    const coordinationObjs = this._spec.map((coordinationSpec) => {
      // low level
      if (coordinationSpec.how === undefined) {
        return this._getCoordinationObjBySpec(coordinationSpec)
      }
      // todo:high level
      return null
    })
    this._constructCoordination(coordinationObjs)
  }

  _getCoordinationObjBySpec(spec) {
    const coordination = { data: {}, transformations: [] }
    coordination.data = this._parseDataSpec(spec.data)
    coordination.transformations = this._parseTransformationsSpec(
      spec.transformations
    )

    return coordination
  }

  _parseDataSpec(spec) {
    const dataObj = {}
    for (const data of spec) {
      if (dataObj[data.name] !== undefined)
        throw new Error('Coordination data name cannot be repeated.')
      dataObj[data.name] = data.properties.map((propStr) => {
        const strSplit = propStr.split('.')
        const visId = strSplit[0]
        const propName = strSplit[1]
        return {
          visId,
          propName,
          propStr,
          prop: this._visualizationsManager.getVisualizationById(visId)
            ._instance[propName],
        }
      })
    }
    return dataObj
  }

  _parseTransformationsSpec(spec) {
    if (spec) {
      return spec.map((transformation) => {
        const instance = this._transformationsManager.generateTransformationInstanceByName(
          transformation.name
        )
        return {
          instance,
          name: transformation.name,
          input: this._parseTransformationsParamSpec(
            instance,
            transformation.input,
            'input'
          ),
          output: this._parseTransformationsParamSpec(
            instance,
            transformation.output,
            'output'
          ),
          triggers: transformation.triggers || 'any',
        }
      })
    }

    return []
  }

  // DataSource, declared data, and literal
  // DataSource -> literal
  _parseTransformationsParamSpec(transformation, spec, type) {
    const paramObj = {}
    // 将array的写法转成obj的写法
    if (spec instanceof Array) {
      spec.forEach((param, index) => {
        let paramName = ''
        if (type === 'input')
          paramName = transformation.getParameterNameByIndex(index)
        else if (type === 'output')
          paramName = transformation.getOutputNameByIndex(index)

        paramObj[paramName] = param
      })
    } else {
      for (const paramName in spec) {
        paramObj[paramName] = spec[paramName]
      }
    }

    if (type === 'output') return paramObj

    // input: 加载obj中的数据源
    // DataSource -> literal
    for (const paramName in paramObj) {
      const paramValue = paramObj[paramName]
      if (typeof paramValue == 'string') {
        const dataSource = this._dataSources.getDataSourceByName(paramValue)
        if (dataSource) {
          if (dataSource.values) paramObj[paramName] = dataSource.values
          else if (dataSource.nodes && dataSource.links)
            paramObj[paramName] = {
              nodes: dataSource.nodes,
              links: dataSource.links,
            }
        }
      }
    }
    return paramObj
  }

  _constructCoordination(coordinationObjs) {
    for (const coordination of coordinationObjs) {
      for (const dataName in coordination.data)
        this._addLinksInPropsInData(coordination.data[dataName])

      if (coordination.transformations) {
        this._addLinksInPropsBetweenDataAndTransformation(
          coordination.data,
          coordination.transformations
        )
      }
    }
  }

  _addLinksInPropsBetweenDataAndTransformation(data, transformations) {
    transformations.forEach((transformation) => {
      const instance = transformation.instance

      // input
      for (const paramName in transformation.input) {
        const propInTransformation = instance[paramName]
        const paramValue = transformation.input[paramName]
        // Declared data: 构建依赖
        if (typeof paramValue == 'string' && paramValue in data) {
          data[paramValue].forEach((d) => {
            this._addUnidirectionalLinkInTwoProps(d.prop, propInTransformation)
          })
        }
        // Literal：直接赋值
        else {
          propInTransformation.set(paramValue)
        }
      }

      // output
      for (const paramName in transformation.output) {
        const propInTransformation = instance[paramName]
        const paramValue = transformation.output[paramName]
        // Declared data: 构建依赖
        if (paramValue in data) {
          data[paramValue].forEach((d) => {
            this._addUnidirectionalLinkInTwoProps(propInTransformation, d.prop)
          })
        }
        // 不存在 declared data：报错
        else {
          throw new SyntaxError('No such data')
        }
      }
    })
  }

  _addLinksInPropsInData(props) {
    for (const prop1 of props) {
      for (const prop2 of props) {
        if (prop1.propStr !== prop2.propStr) {
          if (prop1.prop && prop2.prop)
            this._addUnidirectionalLinkInTwoProps(prop1.prop, prop2.prop)
          else throw new SyntaxError('No such properties')
        }
      }
    }
  }

  _addBidirectionalLinkInTwoProps(prop1, prop2) {
    prop1.addSub(prop2)
    prop2.addSub(prop1)
  }

  _addUnidirectionalLinkInTwoProps(origin, destination) {
    origin.addSub(destination)
  }
}
