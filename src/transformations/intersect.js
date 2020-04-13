import _ from 'lodash'
import ReactiveProperty from '../nebula/reactive-prop'

// todo
export default class Intersect {
  constructor() {
    this.arrays = new ReactiveProperty(this, 'arrays', [], 'run')
    this.key = new ReactiveProperty(this, 'key', '', 'run')
    this.intersection = new ReactiveProperty(this, 'intersection', '', '')
  }

  run() {
    let intersection = []
    // 对象数组的交集
    // if (this.key.get())
    //   intersection = _.intersectionBy(...this.arrays.get(), this.key.get())
    // 值数组的交集
    // else intersection = _.intersection(...this.arrays.get())
    this.intersection.set(intersection)
  }
}
