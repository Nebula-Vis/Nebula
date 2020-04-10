import * as d3 from 'd3'
import ReactiveProperty from '../../nebula/reactive-prop'
import VueAreaChart from './vue_area_chart'
import {
  getFieldsOfType,
  isArrayOfType,
  getDataExtent,
  getNbidsFromData,
  boolDataHasAttributes,
} from '../../utils'

export default class AreaChart {
  constructor(props) {
    this.data = props.data

    const numericFields = getFieldsOfType(this.data, 'number')
    const x = props.x || numericFields[0]
    const y = props.y || numericFields.filter((field) => field !== x)
    const scale = isArrayOfType(props.scale, 'number', 2)
      ? props.scale
      : getDataExtent(this.data, x)
    const selection = props.selection || getNbidsFromData(this.data)

    if (!boolDataHasAttributes(this.data, x, ...y)) {
      throw new Error('AreaChart: wrong attributes')
    }
    if (!isArrayOfType(scale, 'number', 2)) {
      throw new Error('AreaChart: wrong scale')
    }

    this.x = x
    this.y = y
    this.scale = scale
    this.selection = selection

    this.id = new Date().toLocaleString()
    this.el = null
    this.vm = null

    this._init()
  }

  mount(el) {
    if (typeof el === 'string' && !el.startsWith('#')) {
      el = `#${el}`
    }
    this.el = d3.select(el).append('div').node()
    this.vm.$mount(this.el)
  }

  _init() {
    this.vm = new VueAreaChart({
      data: {
        id: this.id,
        data: this.data,
        x: this.x,
        y: this.y,
        selection: this.selection,
        scale: this.scale,
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
    this.vm.$on('data', (val) => {
      this.data.set(val)
    })
    this.vm.$on('scale', (val) => {
      this.scale.set(val)
    })
    this.vm.$on('selection', (val) => {
      this.selection.set(val)
    })

    if (this.el) {
      this.mount(this.el)
    }
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
