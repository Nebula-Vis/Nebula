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

export class ObservableObserver extends Observable {
  constructor(id) {
    super()
    this._id = id
  }
  update(data) {
    this.notify({ origin: this._id, data })
  }
}

export class VisInstanceObserver extends Observer {
  constructor(instance, prop) {
    super()
    this._instance = instance
    this._prop = prop
    this._data = null
  }

  update({ data }) {
    // TODO test equality
    if (data !== this._data) {
      console.log(
        `Updating property '${this._prop}' of visualization '${this._instance.id}`
      )
      this._instance.$props[this._prop] = data // 这太暴力了。应该说这样也行？
    }
    this._data = data
  }
}

export class TransformationObserver extends Observer {
  /**
   * Constructs new TransformationObserver
   * @param {Transformation} transformation the transformation to be executed
   * @param {{[key: string]: string[]}} input transformation parameter name -> visId.data
   * @param {{[key: string]: Observer[]}} output transformation output info
   */
  constructor(transformation, input, output) {
    super()
    this._transformation = transformation
    // paramName -> dataObserver
    this._input = transformation.getObjectParameter(input)
    this._output = transformation.getObjectOuput(output)
    this._data = {}
  }

  async update({ origin, data }) {
    if (!this._updateData(origin, data)) {
      return
    }
    if (!this._isDataComplete()) {
      return
    }
    const result = await this._transformation.run(this._data)
    for (const [key, dest] of Object.entries(this._output)) {
      dest.update(result[key])
    }
  }

  _updateData(origin, data) {
    const endCondition = current => {
      return typeof current === 'string'
    }
    const endTask = (current, path) => {
      if (current === origin) {
        if (_.get(this._data, path) !== data) {
          _.set(this._data, path, data)
          return true
        }
      }
    }
    const collectResult = results => {
      return Object.values(results).some(res => !!res)
    }
    return traverseObject(this._input, endCondition, endTask, collectResult)
  }

  _isDataComplete() {
    const endCondition = current => {
      return typeof current === 'string'
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
}
