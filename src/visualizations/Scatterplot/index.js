import * as d3 from 'd3'
import ReactiveProperty from '../../nebula/reactiveprop'
import VueScatterplot from './VueScatterplot'

export default class Scatterplot {
  constructor(props) {
    this.id = props.id
    this.el = props.el

    this.data = props.data.values
    this.selection = props.selection
    this.scale = props.scale
    this.x = props.x
    this.y = props.y

    this.vm = null

    this._init()
  }

  _init() {
    const el = d3
      .select(this.el)
      .append('div')
      .node()
    this.vm = new VueScatterplot({
      el,
      data: {
        id: this.id,
        data: this.data,
        selection: this.selection,
        x: this.x,
        y: this.y,
      },
    })

    // set被调用时，**这个**可视化该做什么
    this.data = new ReactiveProperty(this, 'data', this.data, '_onDataChange')
    this.selection = new ReactiveProperty(
      this,
      'selection',
      this.selection,
      '_onSelectionChange'
    )
    this.scale = new ReactiveProperty(
      this,
      'scale',
      this.scale,
      '_onScaleChange'
    )
    this.x = new ReactiveProperty(this, 'x', this.x, '_onXChange')
    this.y = new ReactiveProperty(this, 'y', this.y, '_onYChange')

    // 只在直接用户交互时触发
    // 会propagate到subscribers
    this.vm.$on('selection', val => {
      this.selection.set(val)
    })
    this.vm.$on('scale', val => {
      this.scale.set(val)
    })
  }

  _onDataChange(val) {
    this.vm.data = val
  }

  _onSelectionChange(val) {
    this.vm.selection = val
  }

  _onXChange(val) {
    this.vm.x = val
  }

  _onYChange(val) {
    this.vm.y = val
  }

  _onScaleChange(val) {
    this.vm.scale = val
  }
}
