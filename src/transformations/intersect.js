import _ from 'lodash'
import ReactiveProperty from '../reactive-prop'

// 2 array
export default class Intersect {
  constructor() {
    // this.trigger = true
    this._parameterNames = ['array1', 'array2']
    this._outputNames = ['intersection']

    this.array1 = new ReactiveProperty(this, 'array1', [], 'run')
    this.array2 = new ReactiveProperty(this, 'array2', [], 'run')
    this.intersection = new ReactiveProperty(this, 'intersection', '', '')
  }

  getParameterNameByIndex(index) {
    return this._parameterNames[index]
  }

  getOutputNameByIndex(index) {
    return this._outputNames[index]
  }

  run() {
    // if (!this.trigger) return
    const intersection = _.intersection(this.array1.get(), this.array2.get())
    this.intersection.set(intersection)
    // this.trigger
  }
}
