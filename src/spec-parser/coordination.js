import ReactiveProperty from '../reactive-prop'
import { array } from 'vega'
import { ACTIONS, OPTIONS } from '../CONSTANT'

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
      // high level
      const lowLevelSpec = this._parseHighLevelSpecToLowLevel(coordinationSpec)
      // return this._getCoordinationObjBySpec(lowLevelSpec)
      return null
    })
    this._constructCoordination(coordinationObjs)
  }

  _parseHighLevelSpecToLowLevel(spec) {
    // Get visualizations
    const visualizations = spec.visualizations
      ? this._visualizationsManager.getVisualizationsByIds(spec.visualizations)
      : this._visualizationsManager.getAllVisualizations()
    // Parse NL string to how object
    let howObjs = []
    if (spec.how instanceof Array) {
      const originStr = spec.how[0]
      let transformationStr = ''
      let destinationStr = ''
      if (spec.how.length === 3) {
        transformationStr = spec.how[1]
        destinationStr = spec.how[2]
      } else if (spec.how.length === 2) {
        transformationStr = ''
        destinationStr = spec.how[1]
      } else {
        throw new SyntaxError('No such NL command.')
      }
      howObjs = this._parseNlStr(
        originStr,
        transformationStr,
        destinationStr,
        visualizations
      )

      // todo
    }
    // Parse how object to what object
  }

  // NL command -> how object
  _parseNlStr(originStr, transformationStr, destinationStr, visualizations) {
    // 特殊情况：any、other
    if (originStr.includes('any') || destinationStr.includes('others')) {
      return this._parseSpecialNlStr(
        originStr,
        transformationStr,
        destinationStr,
        visualizations
      )
    } else {
      return this._parseOrdinaryNlStr(
        originStr,
        transformationStr,
        destinationStr,
        visualizations
      )
    }
  }

  // NL command (without any, others) -> how object
  _parseOrdinaryNlStr(
    originStr,
    transformationStr,
    destinationStr,
    visualizations
  ) {
    const visualizationsIds = visualizations.map((vis) => vis.getId())
    const howObjs = []
    // origin
    const originWords = this._getWordsInSentence(originStr)
    const originKeyWords = this._getKeyWordObjsInOrigin(
      originWords,
      visualizationsIds
    )
    const originKeyWordsGroup = this._getKeyWordGroupInOrigin(originKeyWords)
    console.log(originKeyWordsGroup)

    // todo

    // transformation
    const transformationWords = this._getWordsInSentence(transformationStr)
    const transformationKeyWordObjs = []

    // destination
  }

  // NL command (with any, others) -> how object
  _parseSpecialNlStr(
    originStr,
    transformationStr,
    destinationStr,
    visualizations
  ) {
    // todo
  }

  _getKeyWordObjsInOrigin(originWords, visualizationsIds) {
    return originWords
      .map((word) => {
        if (ACTIONS.includes(word)) return { value: word, type: 'ACTION' }
        else if (OPTIONS.includes(word)) return { value: word, type: 'OPTION' }
        else if (word === 'and' || word === 'or')
          return { value: word, type: 'CONJUNCTION' }
        else if (word === 'in') return { value: word, type: 'PREPOSITION' }
        else if (visualizationsIds.includes(word))
          return { value: word, type: 'VIS' }
        else throw new SyntaxError('NL command error')
      })
      .filter((wordObj) => {
        return wordObj.type !== 'CONJUNCTION'
      })
  }

  _getKeyWordGroupInOrigin(originKeyWords) {
    const originKeyWordsGroup = [
      {
        actions: [],
        visIds: [],
      },
    ]
    let groupIndex = 0
    for (let i = 0; i < originKeyWords.length; i++) {
      if (i === originKeyWords.length - 1) {
        if (originKeyWords[i].type !== 'VIS')
          throw new SyntaxError('No such NL command')
        else
          originKeyWordsGroup[groupIndex].visIds.push(originKeyWords[i].value)
        continue
      }
      if (
        originKeyWords[i].type === 'ACTION' &&
        originKeyWords[i + 1].type === 'OPTION'
      ) {
        originKeyWordsGroup[groupIndex].actions.push({
          action: originKeyWords[i].value,
          option: originKeyWords[i + 1].value,
        })
        i++
      } else if (
        originKeyWords[i].type === 'ACTION' &&
        originKeyWords[i + 1].type !== 'OPTION'
      ) {
        originKeyWordsGroup[groupIndex].actions.push({
          action: originKeyWords[i].value,
          option: 'items',
        })
      } else if (
        originKeyWords[i].type === 'VIS' &&
        originKeyWords[i + 1].type !== 'ACTION'
      ) {
        originKeyWordsGroup[groupIndex].visIds.push(originKeyWords[i].value)
      } else if (
        originKeyWords[i].type === 'VIS' &&
        originKeyWords[i + 1].type === 'ACTION'
      ) {
        originKeyWordsGroup[groupIndex].visIds.push(originKeyWords[i].value)
        groupIndex++
        originKeyWordsGroup.push({ actions: [], visIds: [] })
      }
    }

    return originKeyWordsGroup
  }

  _getWordsInSentence(sentence) {
    return sentence.split(' ').map(this._getWordWithoutTraillingComma)
  }

  _getWordWithoutTraillingComma(word) {
    const commaPosition = word.indexOf(',')
    if (commaPosition > 0) return word.substring(0, commaPosition)
    else return word
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
        throw new Error('Coordination data name can not be repeated.')
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

  // _addBidirectionalLinkInTwoProps(prop1, prop2) {
  //   prop1.addSub(prop2)
  //   prop2.addSub(prop1)
  // }

  _addUnidirectionalLinkInTwoProps(origin, destination) {
    origin.addSub(destination)
  }
}
