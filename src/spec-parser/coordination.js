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

    const coordinationObjs = []
    this._spec.forEach((coordinationSpec) => {
      // low level
      if (coordinationSpec.how === undefined) {
        coordinationObjs.push(this._getCoordinationObjBySpec(coordinationSpec))
      }
      // high level: 可能是一个，也可能是多个（存在any、others）
      else {
        const lowLevelSpecObj = this._parseHighLevelSpecToLowLevel(
          coordinationSpec
        )
        // this._getCoordinationObjBySpec(lowLevelSpec)
      }
    })
    this._constructCoordination(coordinationObjs)
  }

  // todo
  _parseHighLevelSpecToLowLevel(spec) {
    // Get visualizations
    const visualizations = spec.visualizations
      ? this._visualizationsManager.getVisualizationsByIds(spec.visualizations)
      : this._visualizationsManager.getAllVisualizations()
    // Parse NL string to how object
    // 填补默认值，转化
    const howObjs = []
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
      const result = this._parseNlStr(
        originStr,
        transformationStr,
        destinationStr,
        visualizations
      )

      if (result instanceof Array) howObjs.push(...result)
      else howObjs.push(result)
    }
    // Parse how object to what object
    // 填补隐式transformaition，转化
    // TODO：好像默认值应该在这一步填补来着？
  }

  // NL command -> how object
  _parseNlStr(originStr, transformationStr, destinationStr, visualizations) {
    // 特殊情况：any、other
    if (originStr.includes('any') || destinationStr.includes('others')) {
      return this._parseSpecialNlStr(originStr, destinationStr, visualizations)
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
    const howObj = {}
    // origin
    const originWords = this._getWordsInSentence(originStr)
    const originKeyWords = this._getKeyWordObjsInOriginOrDestination(
      originWords,
      visualizationsIds
    )
    const originKeyWordsGroup = this._getKeyWordGroupInOriginOrDestination(
      originKeyWords,
      'origin'
    )
    howObj.origin = this._getOriginOrDestinationObjByKeyWordsGroup(
      originKeyWordsGroup
    )

    // transformation
    if (transformationStr) {
      const transformationWords = this._getWordsInSentence(transformationStr)
      howObj.transformation = this._getTransformationInHowObjByWords(
        transformationWords,
        howObj.origin.length
      )
    }

    // destination
    const destinationWords = this._getWordsInSentence(destinationStr)
    const destinationKeyWords = this._getKeyWordObjsInOriginOrDestination(
      destinationWords,
      visualizationsIds
    )
    const destinationKeyWordsGroup = this._getKeyWordGroupInOriginOrDestination(
      destinationKeyWords,
      'destination'
    )
    howObj.destination = this._getOriginOrDestinationObjByKeyWordsGroup(
      destinationKeyWordsGroup
    )
    return howObj
  }

  // NL command (with any, others) -> how object
  _parseSpecialNlStr(originStr, destinationStr, visualizations) {
    const howObjs = []
    const visualizationsIds = visualizations.map((vis) => vis.getId())

    const originWords = this._getWordsInSentence(originStr)
    const destinationWords = this._getWordsInSentence(destinationStr)
    const origin = this._parseSpecialNlWords(originWords)
    const destination = this._parseSpecialNlWords(destinationWords)

    if (origin.vis[0] === 'any') origin.vis = visualizationsIds

    for (const originId of origin.vis) {
      for (const destinationId of visualizationsIds) {
        if (originId !== destinationId) {
          howObjs.push({
            origin: [
              { vis: originId, method: origin.action, option: origin.option },
            ],
            destination: [
              {
                vis: destinationId,
                method: destination.action,
                option: destination.option,
                value: '$1',
              },
            ],
          })
        }
      }
    }

    return howObjs
  }

  _parseSpecialNlWords(words) {
    const obj = { action: words[0], option: '', vis: [] }
    if (words.length === 4) {
      obj.option = words[1]
      obj.vis = [words[3]]
    } else if (words.length === 3) {
      obj.option = 'items'
      obj.vis = [words[2]]
    } else {
      throw new Error('No such any/other usage.')
    }
    return obj
  }

  _getKeyWordObjsInOriginOrDestination(words, visualizationsIds) {
    return words
      .map((word) => {
        if (ACTIONS.includes(word)) return { value: word, type: 'ACTION' }
        else if (OPTIONS.includes(word)) return { value: word, type: 'OPTION' }
        else if (['and', 'or'].includes(word))
          return { value: word, type: 'CONJUNCTION' }
        else if (['with', 'in'].includes(word))
          return { value: word, type: 'PREPOSITION' }
        else if (visualizationsIds.includes(word))
          return { value: word, type: 'VIS' }
        else if (word[0] === '$') return { value: word, type: 'DATA' }
        else throw new SyntaxError('NL command error')
      })
      .filter(
        (wordObj) => !['CONJUNCTION', 'PREPOSITION'].includes(wordObj.type)
      )
  }

  _getKeyWordGroupInOriginOrDestination(keyWords, type) {
    const keyWordsGroup = [{ actions: [], visIds: [] }]
    if (type === 'destination') keyWordsGroup[0].params = []
    let groupIndex = 0
    for (let i = 0; i < keyWords.length; i++) {
      if (i === keyWords.length - 1) {
        if (keyWords[i].type === 'VIS') {
          keyWordsGroup[groupIndex].visIds.push(keyWords[i].value)
          if (type === 'destination')
            keyWordsGroup[groupIndex].params.push('$1')
        } else if (keyWords[i].type === 'DATA')
          keyWordsGroup[groupIndex].params.push(keyWords[i].value)
        else throw new SyntaxError('No such NL command')
        break
      }
      if (keyWords[i].type === 'ACTION' && keyWords[i + 1].type === 'OPTION') {
        keyWordsGroup[groupIndex].actions.push({
          action: keyWords[i].value,
          option: keyWords[i + 1].value,
        })
        i++
      } else if (
        keyWords[i].type === 'ACTION' &&
        keyWords[i + 1].type === 'VIS'
      ) {
        keyWordsGroup[groupIndex].actions.push({
          action: keyWords[i].value,
          option: 'items',
        })
      } else if (
        keyWords[i].type === 'VIS' &&
        (keyWords[i + 1].type === 'VIS' || keyWords[i + 1].type === 'DATA')
      ) {
        keyWordsGroup[groupIndex].visIds.push(keyWords[i].value)
      } else if (
        keyWords[i].type === 'VIS' &&
        keyWords[i + 1].type === 'ACTION'
      ) {
        keyWordsGroup[groupIndex].visIds.push(keyWords[i].value)
        keyWordsGroup.push({ actions: [], visIds: [] })
        if (type === 'destination') {
          keyWordsGroup[groupIndex].params.push('$1')
          keyWordsGroup[groupIndex + 1].params = []
        }
        groupIndex++
      } else if (keyWords[i].type === 'DATA') {
        keyWordsGroup[groupIndex].params.push(keyWords[i].value)
        groupIndex++
        keyWordsGroup.push({ actions: [], visIds: [], params: [] })
      } else {
        throw new Error('No such NL command')
      }
    }

    return keyWordsGroup
  }

  _getOriginOrDestinationObjByKeyWordsGroup(keyWordsGroup) {
    const obj = []
    for (const group of keyWordsGroup) {
      for (const action of group.actions) {
        for (const visId of group.visIds) {
          obj.push({
            vis: visId,
            method: action.action,
            option: action.option,
          })
          if (group.params) obj[obj.length - 1].value = group.params[0]
        }
      }
    }
    return obj
  }

  _getTransformationInHowObjByWords(transformationWords, originParameterNum) {
    const transformationObj = { method: '', parameters: [], triggers: 'any' }
    let transformationWordsWithoutTrigger = []
    if (transformationWords[0] === 'when' && transformationWords[1] === 'any')
      transformationWordsWithoutTrigger = transformationWords.slice(2)
    else if (
      transformationWords[0] === 'when' &&
      transformationWords[1] !== 'any'
    ) {
      // 暂时不管此处button存不存在，解析就完事了
      transformationObj.triggers = transformationWords[1]
      transformationWordsWithoutTrigger = transformationWords.slice(3)
    } else transformationWordsWithoutTrigger = transformationWords

    const keyTransformationWords = transformationWordsWithoutTrigger.filter(
      (word) => word !== 'with' && word !== 'and'
    )
    let parameters = []
    if (keyTransformationWords.length > 1) {
      // 有参数，不需要默认值
      parameters = keyTransformationWords.slice(1)
    } else {
      // 自动补全
      parameters = new Array(originParameterNum)
        .fill(0)
        .map((v, i) => `$${i + 1}`)
    }
    transformationObj.method = transformationWordsWithoutTrigger[0]
    transformationObj.parameters = parameters
    return transformationObj
  }

  _getWordsInSentence(sentence) {
    // 分词
    const words = sentence.split(' ').map((word) => {
      const commaPosition = word.indexOf(',')
      if (commaPosition > 0) return word.substring(0, commaPosition)
      else return word
    })
    // 将set data、append data等词合起来
    const removeIndex = []
    for (let i = 0; i < words.length - 1; i++) {
      if (['set', 'append', 'replace'].includes(words[i])) {
        words[i] += ' data'
        removeIndex.push(i + 1)
        i++
      }
    }
    return words.filter((word, index) => {
      return !removeIndex.includes(index)
    })
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
