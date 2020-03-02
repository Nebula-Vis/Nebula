import _ from 'lodash'
import { traverseObject } from '@src/utils'

export class Observer {
  update() {}
}

export class Observable {
  constructor(id) {
    this._id = id
    this._observers = []
  }

  addObserver(observer) {
    if (this._observers.findIndex(obs => obs === observer) === -1) {
      this._observers.push(observer)
    }
  }

  notify(data) {
    this._observers.forEach(observer => {
      observer.update({ origin: this._id, data })
    })
  }
}

export class ObservableObserver extends Observable {
  constructor(id) {
    super(id)
    this._data = null
  }
  update({ data }) {
    if (this._data !== data) {
      this._data = data
      this.notify(data)
    }
  }
}

export class VisPropObservableObserver extends ObservableObserver {
  constructor(id, instance) {
    super(id)
    this._instance = instance
    this._prop = id.split('.')[1]
  }

  update({ origin, data }) {
    // TODO test equality
    if (this._instance.$props[this._prop] !== data) {
      console.log(
        `Updating '${this._instance.id}.${this._prop}', origin: ${origin}`
      )
      this._instance.$props[this._prop] = data // 这太暴力了。应该说这样也行？
      this.notify(data)
    }
  }
}

export class TransformaObservableObserver extends ObservableObserver {
  constructor(transformation, input) {
    super()
    this._transformation = transformation
    // paramName -> "d1"
    this._input = transformation.getObjectParameter(input)
    this._data = {}
    this._observers = {}
  }

  addObserver(observer, key) {
    if (!this._observers[key]) {
      this._observers[key] = []
    }
    if (this._observers[key].findIndex(obs => obs === observer) === -1) {
      this._observers[key].push(observer)
    }
  }

  notify(data) {
    Object.entries(data).forEach(([key, value]) => {
      if (!this._observers[key]) {
        return
      }
      this._observers[key].forEach(observer => {
        observer.update({ data: value })
      })
    })
  }

  async update({ origin, data }) {
    if (!this._updateData(origin, data)) {
      return
    }
    if (!this._isDataComplete()) {
      return
    }
    const result = await this._transformation.run(this._data)
    this.notify(result)
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
