import _ from 'lodash'
import ReactiveProperty from '../reactive-prop'

// Aggregate 1 array
export default class Aggregate {
  constructor() {
    this.trigger = null
    this._parameterNames = ['array', 'type', 'key']
    this._outputNames = ['aggregation']

    this.array = new ReactiveProperty(this, 'array', [], 'run')
    this.type = new ReactiveProperty(this, 'type', '', 'run')
    this.key = new ReactiveProperty(this, 'key', '', 'run')
    this.aggregation = new ReactiveProperty(this, 'aggregation', '', '')
  }

  getParameterNameByIndex(index) {
    return this._parameterNames[index]
  }

  getOutputNameByIndex(index) {
    return this._outputNames[index]
  }

  // get aggregated value of array
  run() {
    if (this.trigger && !this.trigger.get()) return
    if (this.trigger) this.trigger.set(false)

    // 对象的聚合
    if (this.key) {
      if (this.type === 'sum') return _.sumBy(this.array, this.key)
      else if (this.type === 'max')
        return _.maxBy(this.array, this.key)[this.key]
      else if (this.type === 'min')
        return _.minBy(this.array, this.key)[this.key]
      else if (this.type === 'mean' || this.type === 'average')
        return _.meanBy(this.array, this.key)
      else throw new Error(`No such aggregation type: ${this.type}`)
    }
    // 值的聚合
    else {
      if (this.type === 'sum') return _.sum(this.array)
      else if (this.type === 'max') return _.max(this.array)
      else if (this.type === 'min') return _.min(this.array)
      else if (this.type === 'mean' || this.type === 'average')
        return _.mean(this.array)
      else if (this.type === 'count') return this.array.length
      // count不允许有key
      else throw new Error(`No such aggregation type: ${this.type}`)
    }
  }
}
