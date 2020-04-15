import _ from 'lodash'
import ReactiveProperty from '../reactive-prop'

// 2 array
export default class RangesToItems {
  constructor() {
    this._parameterNames = ['ranges', 'keys', 'data']
    this._outputNames = ['items']

    this.trigger = null
    this.ranges = new ReactiveProperty(this, 'ranges', [], 'run')
    this.keys = new ReactiveProperty(this, 'keys', [], 'run')
    this.data = new ReactiveProperty(this, 'data', [], 'run')
    this.items = new ReactiveProperty(this, 'items', [], '')
  }

  getParameterNameByIndex(index) {
    return this._parameterNames[index]
  }

  getOutputNameByIndex(index) {
    return this._outputNames[index]
  }

  run() {
    if (this.trigger && !this.trigger.get()) return
    if (this.trigger) this.trigger.set(false)

    const ranges = this.ranges.get()
    const keys = this.keys.get()
    const data = this.data.get()
    const items = data.filter((d) =>
      keys.every((key, i) => _.inRange(d[key], ranges[i][0], ranges[i][1]))
    )
    this.items.set(items)
  }
}
