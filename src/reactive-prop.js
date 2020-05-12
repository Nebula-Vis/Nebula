import _ from 'lodash'
import { ACTIONS, ACTION_TO_OPTIONS } from '@/CONSTANT'

export default class ReactiveProperty {
  constructor(instance, name, value, cb, action, option) {
    this.instance = instance // 所属实例
    this.name = name // 属性名
    this.value = value // 属性值
    this.cb = cb // string: value，改变时的回调函数名

    if (action) {
      this.action = action
      if (ACTION_TO_OPTIONS[action] && !option) {
        option = ACTION_TO_OPTIONS[action][0]
      }
      this.option = option
      if (
        !ACTIONS.includes(this.action) ||
        (ACTION_TO_OPTIONS[this.action] &&
          !ACTION_TO_OPTIONS[this.action].includes(this.option))
      )
        throw new SyntaxError(
          `No such action or option ${this.action}, ${this.option}`
        )
    }

    this.subs = [] // 订阅者，同样是ReactiveProperty类型
  }

  // sub: other reactive properties
  addSub(sub) {
    this.subs.push(sub)
    // 设置依赖的时候就赋值一遍
    sub.set(this.value)
  }

  get() {
    return this.value
  }

  set(value) {
    if (this.action && this.action.startsWith('append')) {
      this._append(value)
    } else {
      this._replace(value)
    }
  }

  _replace(value) {
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

  _append(value) {
    if (!(this.value instanceof Array))
      throw new TypeError(
        `ReactiveProperty: expected append to be called on array value, got ${this.value}`
      )

    this.value.push(value)
    if (this.instance && this.cb && this.instance[this.cb])
      this.instance[this.cb](this.value)

    // 更新依赖
    this._notifySubs(this.value)
  }

  _notifySubs(value) {
    this.subs.forEach((sub) => {
      sub.set(value)
    })
  }
}
