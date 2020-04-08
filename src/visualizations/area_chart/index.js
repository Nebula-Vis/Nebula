import * as d3 from 'd3'
import ReactiveProperty from '../../nebula/reactive_prop'
import VueAreaChart from './vue_area_chart'

export default class AreaChart {
  constructor(props) {
    this.id = props.id
    this.el = props.el

    this.data = props.data.values
    this.x = props.x
    this.y = props.y
    this.scale = props.scale
    this.selection = props.selection

    this.vm = null

    this._init()
  }

  _init() {
    const el = d3
      .select(this.el)
      .append('div')
      .node()
    this.vm = new VueAreaChart({
      el,
      data: {
        id: this.id,
        data: this.data,
        x: this.x,
        y: this.y,
        selection: this.selection,
        scale: this.scale
      },
    })

    // set被调用时，**这个**可视化该做什么
    this.data = new ReactiveProperty(this, 'data', this.data, '_onDataChange')
    this.x = new ReactiveProperty(this, 'x', this.x, '_onXChange')
    this.y = new ReactiveProperty(this, 'y', this.y, '_onYChange')
    this.scale = new ReactiveProperty(
      this,
      'scale',
      this.scale,
      '_onScaleChange'
    )
    this.selection = new ReactiveProperty(
      this,
      'selection',
      this.selection,
      '_onSelectionChange'
    )

    // 只在直接用户交互时触发
    // 会propagate到subscribers
    this.vm.$on('data', val => {
      this.data.set(val)
    })
    this.vm.$on('scale', val => {
      this.scale.set(val)
    })
    this.vm.$on('selection', val => {
      this.selection.set(val)
    })
  }

  _onDataChange(val) {
    this.vm.data = val
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

  _onSelectionChange(val) {
    this.vm.selection = val
  }
}
