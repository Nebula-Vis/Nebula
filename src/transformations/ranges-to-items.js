import ReactiveProperty from '@/reactive-prop'

export default class RangesToItems {
  constructor() {
    this._parameterNames = ['ranges', 'data']
    this._outputNames = ['items']

    this.trigger = null
    this.ranges = new ReactiveProperty(this, 'ranges', [], 'run')
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
    const data = this.data.get()
    const items = data.filter((d) => this.boolDatumInRanges(d, ranges))

    this.items.set(items)
  }

  boolDatumInRanges(datum, ranges) {
    return Object.keys(ranges).every(
      (key) =>
        datum[key] === undefined ||
        (datum[key] >= ranges[key][0] && datum[key] <= ranges[key][1])
    )
  }
}
