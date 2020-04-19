export default class LowLevelCoordinationSpecParser {
  constructor(dataSources, visualizationsManager, transformationsManager) {
    this._dataSources = dataSources
    this._visualizationsManager = visualizationsManager
    this._transformationsManager = transformationsManager
  }

  parse(spec) {
    const coordination = { dataVisualization: {}, transformation: [] }
    coordination.dataVisualization = this._parseDataSpec(
      spec['data-visualization']
    )
    coordination.transformation = this._parseTransformationSpec(
      spec.transformation
    )
    return coordination
  }

  _parseDataSpec(spec) {
    const dataObj = {}
    for (const data of spec) {
      if (dataObj[data.name] !== undefined)
        throw new Error(`Coordination data name repeated ${data.name}.`)
      dataObj[data.name] = {}

      dataObj[data.name].bidirectionalBind = data.bind
        .filter((propStr) => !this._isUnidirectionalPropStr(propStr))
        .map((propStr) => this._parsePropStrInDataSpec(propStr))
      dataObj[data.name].unidirectionalBind = data.bind
        .filter((propStr) => this._isUnidirectionalPropStr(propStr))
        .map((propStr) => this._parsePropStrInDataSpec(propStr))
    }
    return dataObj
  }

  _parsePropStrInDataSpec(propStr) {
    const [visId, propName] = propStr.split('.')
    return {
      visId,
      propName,
      rawStr: propStr,
      prop: this._visualizationsManager.getVisualizationById(visId)._instance[
        propName
      ],
    }
  }

  _parseTransformationSpec(spec) {
    if (spec) {
      // 生成transformation实例
      const instance = this._transformationsManager.generateTransformationInstanceByName(
        spec.name
      )
      return {
        instance,
        name: spec.name,
        input: this._parseTransformationsParamSpec(
          instance,
          spec.input,
          'input'
        ),
        output: this._parseTransformationsParamSpec(
          instance,
          spec.output,
          'output'
        ),
        triggers: spec.triggers || 'any',
      }
    } else {
      return null
    }
  }

  // 处理transformation中的input和output
  // 转化成object，并load data sources
  _parseTransformationsParamSpec(transformation, spec, type) {
    const paramObj = {}
    // 将array的写法转成obj的写法
    if (spec instanceof Array) {
      // array
      spec.forEach((param, index) => {
        let paramName = ''
        if (type === 'input') {
          paramName = transformation.getParameterNameByIndex(index)
          paramObj[paramName] = param
        } else if (type === 'output') {
          paramName = transformation.getOutputNameByIndex(index)
          paramObj[paramName] = param.map((paramStr) => {
            return this._parsePropStrInDataSpec(paramStr)
          })
        }
      })
    } else {
      // obj
      for (const paramName in spec) {
        paramObj[paramName] = spec[paramName]
      }
    }

    if (type === 'output') return paramObj

    // load data sources in input
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

  _isUnidirectionalPropStr(propStr) {
    return 'unidirectional' === propStr.substring(propStr.lastIndexOf('.') + 1)
  }
}
