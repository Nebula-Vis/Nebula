import _ from 'lodash'
import { traverseObject } from '@src/utils'

export class Observer {
  update() {}
}

export class Observable {
  constructor() {
    this._observers = []
  }

  addObserver(observer) {
    if (this._observers.findIndex(obs => obs === observer) === -1) {
      this._observers.push(observer)
    }
  }

  notify(data) {
    this._observers.forEach(observer => {
      observer.update(data)
    })
  }
}

export class VisInstanceObserver extends Observer {
  constructor(instance, prop) {
    super()
    this._instance = instance
    this._prop = prop
  }

  update({ data }) {
    this._instance.$props[this._prop] = data // 这太暴力了。应该说这样也行？
  }
}

export class TransformationObserver extends Observer {
  /**
   * Constructs new TransformationObserver
   * @param {Transformation} transformation the transformation to be executed
   * @param {{[key: string]: string[]}} input transformation parameter name -> visId.data
   * @param {{[key: string]: Observer[]}} output transformation output info
   */
  constructor(transformation, input, dataMap, output, observerMap) {
    super()
    this._transformation = transformation
    this._input = this._getInputStructure(transformation, input, dataMap)
    this._output = this._getOutputMap(
      transformation,
      output,
      dataMap,
      observerMap
    )
    this._data = {}
  }

  async update({ origin, data }) {
    this._updateData(origin, data)
    if (!this._isDataComplete()) {
      return
    }
    const result = await this._transformation.run(this._data)
    for (const [key, observers] of Object.entries(this._output)) {
      observers.forEach(observer => {
        observer.update({ data: result[key] })
      })
    }
  }

  _updateData(origin, data) {
    const endCondition = current => {
      return Array.isArray(current) && typeof current[0] === 'string'
    }
    const endTask = (current, path) => {
      if (current.includes(origin)) {
        _.set(this._data, path, data)
      }
    }
    traverseObject(this._input, endCondition, endTask)
  }

  _isDataComplete() {
    const endCondition = current => {
      return Array.isArray(current) && typeof current[0] === 'string'
    }
    const endTask = (current, path) => {
      return _.get(this._data, path) !== undefined
    }
    const collectResult = results => {
      if (Array.isArray(results)) {
        return results.every(res => res === true)
      }
      if (typeof results === 'object') {
        return Object.values(results).every(res => res === true)
      }
    }
    return traverseObject(this._input, endCondition, endTask, collectResult)
  }

  /**
   * resolve input structure for a transformation
   * @param {Transformation} transformation
   * @param {Array|Object} input input config in transformation config
   * @param {{[dataName: string]: string[]}} dataMap a map of data config in coordination config
   * @returns {{[paramName: string]: any}}
   */
  _getInputStructure(transformation, input, dataMap) {
    const inputObj = transformation.getObjectParameter(input)
    const endCondition = current => {
      return typeof current === 'string'
    }
    const endTask = current => {
      return dataMap[current]
    }
    return traverseObject(inputObj, endCondition, endTask)
  }

  /**
   * Get a map of outputFieldName -> observers for a transformation
   * @param {Transformation} transformation
   * @param {Array|Object} output output config in transformation config
   * @param {{[dataName: string]: string[]}} dataMap a map of data config in coordination config
   * @param {{[id: string]: Observer}} observerMap
   * @returns {{[paramName: string]: Observer[]}}
   */
  _getOutputMap(transformation, output, dataMap, observerMap) {
    const outputObj = transformation.getObjectOuput(output)
    return _.mapValues(outputObj, dataName => {
      return dataMap[dataName].map(dest => observerMap[dest])
    })
  }
}
