import _ from 'lodash'

export default class ReactiveProperty {
  constructor(instance, name, value, cb) {
    this.instance = instance // 所属实例
    this.name = name // 属性名
    this.value = value // 属性值
    this.cb = cb // string: value，改变时的回调函数名
    this.subs = [] // 订阅者，同样是ReactiveProperty类型
  }

  // sub: other reactive properties
  addSub(sub) {
    this.subs.push(sub)
    sub.set(this.value)
  }

  get() {
    return this.value
  }

  // TODO: options, data transformation, triggers
  set(value) {
    if (_.isEqual(value, this.value)) {
      // 相同的值不反复调用
      return
    }

    this.value = value
    // 更新实例更新
    if (this.instance && this.cb && this.instance[this.cb])
      this.instance[this.cb](value)

    // 更新依赖
    this._notifySubs(value)
  }

  append(value) {
    if (!(this.value instanceof Array))
      throw new TypeError('Only arrays accept appending values')

    this.value.push(value)
    if (this.instance && this.cb && this.instance[this.cb])
      this.instance[this.cb](value)

    // 更新依赖
    this._notifySubs(this.value)
  }

  _notifySubs(value) {
    this.subs.forEach((sub) => {
      sub.set(value)
    })
  }
}
