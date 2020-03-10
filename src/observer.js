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

export class DataObservableObserver extends ObservableObserver {
  constructor(id) {
    super(id)
    this._oldData = null
    this._updateCallback = null
  }

  update({ origin, data }) {
    if (this._data !== data) {
      this._data = data
      if (origin === 'transformation') {
        this.trigger()
      }
      if (this._updateCallback) {
        this._updateCallback(this._data)
      }
    }
  }

  onUpdate(callback) {
    this._updateCallback = callback
  }

  trigger() {
    if (this._data !== this._oldData) {
      this._oldData = this._data
      this.notify(this._data)
    }
  }
}

export class TransformaObservableObserver extends ObservableObserver {
  constructor(transformation, input) {
    super()
    this._transformation = transformation
    // "d1" -> paramPath, e.g. param1.propA[0]
    this._inputMap = this._getInputMap(input, transformation)
    this._data = {}
    this._oldData = {}
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
        observer.update({ origin: 'transformation', data: value })
      })
    })
  }

  async update({ origin, data }) {
    this._updateData(origin, data)
    if (this._isDataReady()) {
      const result = await this._transformation.run(this._data)
      this._updateOldData()
      this.notify(result)
    }
  }

  _getInputMap(input, transformation) {
    const inputMap = {}
    const inputObj = transformation.getObjectParameter(input)
    const endCondition = current => {
      return typeof current === 'string'
    }
    const endTask = (current, path) => {
      inputMap[current] = [...path]
    }
    traverseObject(inputObj, endCondition, endTask)
    return inputMap
  }

  _updateData(origin, data) {
    const path = this._inputMap[origin]
    if (_.get(this._data, path) !== data) {
      _.set(this._data, path, data)
    }
  }

  _isDataReady() {
    return (
      Object.values(this._inputMap).some(
        path => _.get(this._data, path) !== _.get(this._oldData, path)
      ) &&
      Object.values(this._inputMap).every(
        path => _.get(this._data, path) !== undefined
      )
    )
  }

  _updateOldData() {
    Object.values(this._inputMap).forEach(path => {
      _.set(this._oldData, path, _.get(this._data, path))
    })
  }
}
