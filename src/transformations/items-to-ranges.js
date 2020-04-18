import * as d3 from 'd3'
import ReactiveProperty from '../reactive-prop'

// 2 array
export default class ItemsToRanges {
  constructor() {
    this._parameterNames = ['items', 'keys']
    this._outputNames = ['ranges']

    this.trigger = null
    this.items = new ReactiveProperty(this, 'items', [], 'run')
    this.keys = new ReactiveProperty(this, 'keys', [], 'run')
    this.ranges = new ReactiveProperty(this, 'ranges', [], '')
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

    const items = this.items.get()
    const keys = this.keys.get()
    const ranges = keys.map((key) => d3.extent(items, (d) => d[key]))

    if (keys.length === 1) {
      this.ranges.set(ranges[0])
    } else {
      this.ranges.set(ranges)
    }
  }
}
