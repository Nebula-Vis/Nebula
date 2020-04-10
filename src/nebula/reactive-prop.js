import _ from 'lodash'

export default class ReactiveProperty {
  constructor(vis, name, value, cb) {
    this.vis = vis // 所属的可视化
    this.name = name
    this.value = value
    this.cb = cb // value改变时的回调函数名
    this.subs = [] // 订阅者，同样是ReactiveProperty类型
  }

  addSub(sub) {
    this.subs.push(sub)
  }

  get() {
    return this.value
  }

  // TODO: options, data transformation, triggers

  // 外到内、内到外，都用这个
  set(value) {
    if (_.isEqual(value, this.value)) {
      // 相同的值不反复调用
      return
    }

    this.value = value
    // 内部自我更新
    if (this.vis && this.cb && this.vis[this.cb]) this.vis[this.cb](value)

    this._notifySubs(value)
  }

  _notifySubs(value) {
    this.subs.forEach((sub) => {
      sub.set(value)
    })
  }
}
