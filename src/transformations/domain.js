import _ from 'lodash'
import ReactiveProperty from '../reactive-prop'

// get domain of an array
export default class Domain {
  constructor() {
    // this.trigger = true
    this._parameterNames = ['array', 'x', 'y']
    this._outputNames = ['domain']

    this.array = new ReactiveProperty(this, 'array', [], 'run')
    this.x = new ReactiveProperty(this, 'x', '', 'run')
    this.y = new ReactiveProperty(this, 'y', '', 'run')
    this.domain = new ReactiveProperty(this, 'domain', [], '')
  }

  getParameterNameByIndex(index) {
    return this._parameterNames[index]
  }

  getOutputNameByIndex(index) {
    return this._outputNames[index]
  }

  // get aggregated value of array
  run() {
    // if (!this.trigger) return
    // todo
    // this.trigger
  }
}
