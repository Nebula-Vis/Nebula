import ReactiveProperty from '../reactive-prop'

import Intersect from './intersect'

export default class TransformationsManager {
  constructor() {
    this._getBuiltInTransformations()
  }

  _getBuiltInTransformations() {
    this.intersect = Intersect
  }

  addExternalTransformations(transformation) {
    // 并没有实际的生成transformation class
    // 而是将信息存储下来，generate时直接构造实例
    this[transformation.name] = transformation
  }

  generateTransformationInstanceByName(name) {
    if (!this[name]) throw new SyntaxError(`No such transformation ${name}`)
    // class：该数据转化是内置的，可以直接生成实例
    if (typeof this[name] === 'function') return new this[name]()
    // object：该数据转化是用户定义的，需要手动构造生成实例
    else if (typeof this[name] === 'object')
      return new ExternalTransformation(
        this[name].name,
        this[name].url,
        this[name].parameters,
        this[name].output
      )
  }
}

class ExternalTransformation {
  constructor(name, url, parameterNames, outputNames) {
    this._name = name
    this._url = url
    this._parameterNames = parameterNames
    this._outputNames = outputNames
    // trigger
    // this.trigger = false

    for (const parameterName of this._parameterNames) {
      this[parameterName] = new ReactiveProperty(
        this,
        parameterName,
        null,
        'run'
      )
    }

    for (const outputName of this._outputNames) {
      this[outputName] = new ReactiveProperty(this, outputName, null, '')
    }
  }

  async run() {
    // if (!this.trigger) return

    const paramObj = {}

    for (const parameterName of this._parameterNames) {
      paramObj[parameterName] = this[parameterName].get()
    }

    const resp = await fetch(this._url, {
      method: 'POST',
      body: paramObj,
    })
    const result = resp.json()
    for (const outputName of this._outputNames) {
      this[outputName].set(result[outputName])
    }
  }

  getName() {
    return this._name
  }
}
