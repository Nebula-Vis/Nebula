import _ from 'lodash'
import ReactiveProperty from '../nebula/reactive-prop'

// test
export default class Intersect2 {
  constructor() {
    this.array1 = new ReactiveProperty(this, 'array1', [], 'run')
    this.array2 = new ReactiveProperty(this, 'array2', [], 'run')
    this.key = new ReactiveProperty(this, 'key', '', 'run')
    this.intersection = new ReactiveProperty(this, 'intersection', '', '')
  }

  run() {
    const intersection = _.intersection(this.array1.get(), this.array2.get())
    this.intersection.set(intersection)
  }
}
