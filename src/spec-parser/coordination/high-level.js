import _ from 'lodash'
import { ACTIONS, OPTIONS, ACTION_TO_OPTIONS } from '../../CONSTANT'

export default class HighLevelCoordinationSpecParser {
  constructor(visualizationsManager) {
    this._visualizationsManager = visualizationsManager
  }

  parse(spec) {
    // Get visualization ids
    const visualizationIds =
      spec.visualizations ||
      this._visualizationsManager.getAllVisualizationIds()

    // Parse NL string to how object directly
    const rawNl = this._parseSynonyms(spec.how || spec)
    const nlArray = this._parseRawNlToNlArray(rawNl)
    const rawHowObj = this._parseNlStrArray(nlArray, visualizationIds)
    // console.log(rawHowObj)

    // Handle how object
    // default value: option, value, trigger, set data -> replace data
    // any, others
    // check grammar and fix ambiguity (decomposing, implicit transformation)
    this._addDefaultValueInHowObj(rawHowObj)
    const rawHowObjs = this._handleAnyAndOthersInHowObj(
      rawHowObj,
      visualizationIds
    )
    const howObjs = this._checkAndFixHowObjs(rawHowObjs)
    // console.log(howObjs)

    // Parse how object to what object
    return howObjs.map((howObj) => this._parseHowObjToWhatObj(howObj))
  }

  _parseSynonyms(nl) {
    return nl
      .replace(/select|highlight/g, 'select')
      .replace(/filter/g, 'filter')
      .replace(/navigate|pan|zoom|scroll/g, 'navigate')
      .replace(
        /reconfigure|rearrange|arrange|organize|sort|align/g,
        'reconfigure'
      )
      .replace(/encode/g, 'encode')
      .replace(/set|modify|change|replace/g, 'set')
      .replace(/append|add/g, 'append')
  }

  _parseRawNlToNlArray(nl) {
    // 根据then，将一句话分为2-3句话
    const nlArray = []
    const thenIndex0 = nl.indexOf('then')
    if (thenIndex0 > 0) {
      nlArray.push(nl.slice(0, thenIndex0))
    } else {
      throw new SyntaxError('No connect word: then')
    }
    const thenIndex1 = nl.indexOf('then', thenIndex0 + 1)
    if (thenIndex1 > 0) {
      nlArray.push(nl.slice(thenIndex0 + 4, thenIndex1))
      nlArray.push(nl.slice(thenIndex1 + 4))
    } else {
      nlArray.push(nl.slice(thenIndex0 + 4))
    }
    return nlArray
  }

  _parseNlStrArray(nlArray, visualizationIds) {
    const {
      originStr,
      transformationStr,
      destinationStr,
    } = this._getNlRawStrFromArray(nlArray)
    return this._parseNlStr(
      originStr,
      transformationStr,
      destinationStr,
      visualizationIds
    )
  }

  _getNlRawStrFromArray(nlArray) {
    const originStr = nlArray[0]
    let transformationStr = ''
    let destinationStr = ''
    if (nlArray.length === 3) {
      transformationStr = nlArray[1]
      destinationStr = nlArray[2]
    } else if (nlArray.length === 2) {
      transformationStr = ''
      destinationStr = nlArray[1]
    } else {
      throw new SyntaxError(
        `CoordinationSpecParser: No such NL command ${nlArray}.`
      )
    }
    return { originStr, transformationStr, destinationStr }
  }

  _parseNlStr(originStr, transformationStr, destinationStr, visualizationIds) {
    const howObj = {}
    // origin
    const originWords = this._getWordsInSentence(originStr)
    const originKeyWords = this._getKeyWordObjsInOriginOrDestination(
      originWords,
      visualizationIds
    )
    const originKeyWordsGroup = this._getKeyWordGroupInOriginOrDestination(
      originKeyWords
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
      visualizationIds
    )
    const destinationKeyWordsGroup = this._getKeyWordGroupInOriginOrDestination(
      destinationKeyWords
    )
    howObj.destination = this._getOriginOrDestinationObjByKeyWordsGroup(
      destinationKeyWordsGroup
    )
    return howObj
  }

  _getKeyWordObjsInOriginOrDestination(words, visualizationIds) {
    return (
      words
        .map((word) => {
          if (ACTIONS.includes(word)) return { value: word, type: 'ACTION' }
          else if (OPTIONS.includes(word))
            return { value: word, type: 'OPTION' }
          else if (word[0] === '$') return { value: word, type: 'DATA' }
          else if ([...visualizationIds, 'any', 'others'].includes(word))
            return { value: word, type: 'VIS' }
          else return { value: word, type: 'not important' }
        })
        // 只留action, option, data, vis
        .filter((wordObj) => wordObj.type !== 'not important')
    )
  }

  _getKeyWordGroupInOriginOrDestination(keyWords) {
    const keyWordsGroup = [{ actions: [], visIds: [] }]
    let groupIndex = 0
    for (let i = 0; i < keyWords.length; i++) {
      if (keyWords[i].type === 'ACTION') {
        keyWordsGroup[groupIndex].actions.push({
          action: keyWords[i].value,
        })
      } else if (keyWords[i].type === 'OPTION') {
        const index = keyWordsGroup[groupIndex].actions.length - 1
        keyWordsGroup[groupIndex].actions[index].option = keyWords[i].value
      } else if (
        keyWords[i].type === 'VIS' &&
        (!keyWords[i + 1] ||
          keyWords[i + 1].type === 'VIS' ||
          keyWords[i + 1].type === 'DATA')
      ) {
        keyWordsGroup[groupIndex].visIds.push(keyWords[i].value)
      } else if (
        keyWords[i].type === 'VIS' &&
        keyWords[i + 1].type === 'ACTION'
      ) {
        keyWordsGroup[groupIndex].visIds.push(keyWords[i].value)
        keyWordsGroup.push({ actions: [], visIds: [] })
        groupIndex++
      } else if (keyWords[i].type === 'DATA') {
        keyWordsGroup[groupIndex].params = [keyWords[i].value]
        groupIndex++
        keyWordsGroup.push({ actions: [], visIds: [] })
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
          })
          if (action.option) obj[obj.length - 1].option = action.option
          if (group.params) obj[obj.length - 1].value = group.params[0]
        }
      }
    }
    return obj
  }

  _getTransformationInHowObjByWords(transformationWords, originParameterNum) {
    const transformationObj = {}
    let transformationWordsWithoutTrigger = []
    // trigger
    if (transformationWords[0] === 'when' && transformationWords[1] === 'any') {
      transformationWordsWithoutTrigger = transformationWords.slice(2)
      transformationObj.triggers = 'any'
    } else if (
      transformationWords[0] === 'when' &&
      transformationWords[1] !== 'any'
    ) {
      transformationWordsWithoutTrigger = transformationWords.slice(3)
      transformationObj.triggers = transformationWords[1]
    } else transformationWordsWithoutTrigger = transformationWords

    // method and parameters
    const keyTransformationWords = transformationWordsWithoutTrigger.filter(
      (word) => word !== 'with' && word !== 'and'
    )
    transformationObj.method = transformationWordsWithoutTrigger[0]
    if (keyTransformationWords.length > 1) {
      transformationObj.parameters = keyTransformationWords.slice(1)
    }
    return transformationObj
  }

  _getWordsInSentence(sentence) {
    // 分词
    return sentence
      .trim()
      .split(' ')
      .map((word) => word.replace(',', ''))
  }

  _addDefaultValueInHowObj(howObj) {
    // origin: add option, set data -> replace data
    howObj.origin.forEach((o) => {
      if (!o.option) o.option = ACTION_TO_OPTIONS[o.method][0]
    })

    // transformation: add trigger and parameters
    if (howObj.transformation) {
      if (!howObj.transformation.triggers)
        howObj.transformation.triggers = 'any'
      if (!howObj.transformation.parameters)
        howObj.transformation.parameters = howObj.origin.map(
          (o, i) => `$${i + 1}`
        )
    }

    // destination: add option and value, set data -> replace data
    howObj.destination.forEach((d) => {
      if (!d.option) d.option = ACTION_TO_OPTIONS[d.method][0]
      if (!d.value) d.value = '$1'
    })
  }

  _handleAnyAndOthersInHowObj(howObj, visualizationIds) {
    if (!this._isAnyOthersExistInHowObj(howObj)) return [howObj]
    if (
      howObj.origin.length === 1 &&
      !howObj.transformation &&
      howObj.destination.length === 1 &&
      howObj.destination[0].vis === 'others'
    ) {
      const howObjs = []
      const originVisIds =
        howObj.origin[0].vis === 'any'
          ? visualizationIds
          : [howObj.origin[0].vis]
      const destinationVisIds = visualizationIds

      for (const originId of originVisIds) {
        for (const destinationId of destinationVisIds) {
          if (originId !== destinationId) {
            howObjs.push({
              origin: [
                {
                  vis: originId,
                  method: howObj.origin[0].method,
                  option: howObj.origin[0].option,
                },
              ],
              destination: [
                {
                  vis: destinationId,
                  method: howObj.destination[0].method,
                  option: howObj.destination[0].option,
                  value: '$1',
                },
              ],
            })
          }
        }
      }
      return howObjs
    } else {
      throw new SyntaxError('No such any/other usage.')
    }
  }

  _isAnyOthersExistInHowObj(howObj) {
    for (const origin of howObj.origin) {
      if (origin.vis === 'any') return true
    }
    for (const destination of howObj.destination) {
      if (destination.vis === 'others') return true
    }
    return false
  }

  _checkAndFixHowObjs(rawHowObjs) {
    const howObjs = []
    for (const rawHowObj of rawHowObjs) {
      // check：没有transformation，可分解，易歧义
      if (!rawHowObj.transformation) {
        // 多个origin没有transformation：歧义
        if (rawHowObj.origin.length > 1)
          throw new SyntaxError(
            'Ambiguity: mutliple origin without transformation'
          )
        // 一个origin没有transformation：可分解？implicit transformation？
        else {
          // 分解
          const tmpHowObjs = rawHowObj.destination.map((d) => {
            return {
              origin: [rawHowObj.origin[0]],
              destination: [d],
            }
          })
          // add implicit transformation
          tmpHowObjs.forEach((obj) => {
            if (
              obj.origin[0].method !== obj.destination[0].method ||
              (obj.origin[0].method === obj.destination[0].method &&
                obj.origin[0].option !== obj.destination[0].option)
            )
              this._addImplicitTransformationInHowObj(obj)
          })
          howObjs.push(...tmpHowObjs)
        }
      }
      // check：有transformation，严格，问题不大
      else {
        howObjs.push(rawHowObj)
      }
    }
    return howObjs
  }

  _addImplicitTransformationInHowObj(howObj) {
    // select in xx, navigate in yy -> select in xx, xxx transformation, navigate in yy
    if (
      howObj.origin[0].method === 'select' &&
      howObj.origin[0].option === 'items' &&
      howObj.destination[0].method === 'navigate'
    ) {
      howObj.transformation = {
        triggers: 'any',
        method: 'items-to-ranges',
        parameters: ['$1'],
      }
    }
  }

  _parseHowObjToWhatObj(howObj) {
    const whatObj = { 'data-visualization': [] } // 填data和transformation字段
    if (!howObj.transformation) {
      // 没有transformation
      // origin，destination都只有一个（分解过）
      // 填data
      whatObj['data-visualization'].push({
        name: `$${1}`,
        bind: [
          this._visualizationsManager
            .getVisualizationById(howObj.origin[0].vis)
            .getVisPropByActionOption(
              howObj.origin[0].method,
              howObj.origin[0].option
            ),
          `${this._visualizationsManager
            .getVisualizationById(howObj.destination[0].vis)
            .getVisPropByActionOption(
              // 日常推销ts：比如用js的话这里就没法查看函数定义，整个就是any
              howObj.destination[0].method,
              howObj.destination[0].option
            )}.unidirectional`,
        ],
      })
    } else {
      // 有transformation
      // origin，destination不定，但没有dependencies
      // 填data
      howObj.origin.forEach((o, i) => {
        whatObj['data-visualization'].push({
          name: `$${i + 1}`,
          bind: [
            this._visualizationsManager
              .getVisualizationById(o.vis)
              .getVisPropByActionOption(o.method, o.option),
          ],
        })
      })
      // 填transformation
      whatObj.transformation = {
        name: howObj.transformation.method,
        triggers: howObj.transformation.triggers,
        input: howObj.transformation.parameters,
        output: [],
      }
      const outputCount = Number(
        _.maxBy(howObj.destination, (o) =>
          Number(o.value.slice(1))
        ).value.slice(1)
      )
      whatObj.transformation.output = new Array(outputCount).fill([])
      howObj.destination.forEach((d) => {
        const index = Number(d.value.slice(1)) - 1
        const visPropStr = this._visualizationsManager
          .getVisualizationById(d.vis)
          .getVisPropByActionOption(d.method, d.option)
        whatObj.transformation.output[index].push(visPropStr)
      })
    }
    return whatObj
  }
}
