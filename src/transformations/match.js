import _ from 'lodash'
import ReactiveProperty from '../reactive-prop'

// 2 array
export default class Match {
  constructor() {
    this._parameterNames = [
      'originItems',
      'originKey',
      'destinationKey',
      'destinationData',
    ]
    this._outputNames = ['itemsDestination']

    this.trigger = null
    this.originItems = new ReactiveProperty(this, 'originItems', [], 'run')
    this.originKey = new ReactiveProperty(this, 'originKey', '', 'run')
    this.destinationKey = new ReactiveProperty(
      this,
      'destinationKey',
      '',
      'run'
    )
    this.destinationData = new ReactiveProperty(
      this,
      'destinationData',
      [],
      'run'
    )
    this.itemsDestination = new ReactiveProperty(
      this,
      'itemsDestination',
      [],
      ''
    )
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

    const originItems = this.originItems.get()
    const originKey = this.originKey.get()
    const destinationKey = this.destinationKey.get()
    const destinationData = this.destinationData.get()

    const valueOriginSet = new Set(originItems.map((d) => d[originKey]))
    const itemsDestination = destinationData.filter((d) =>
      valueOriginSet.has(d[destinationKey])
    )
    this.itemsDestination.set(itemsDestination)
  }
}
