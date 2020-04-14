import * as d3 from 'd3'
import ReactiveProperty from '../../reactive-prop'
import VueAreaChart from './vue_area_chart'
import {
  getFieldsOfType,
  isArrayOfType,
  getDataExtent,
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
    const selection = props.selection || this.data

    if (!boolDataHasAttributes(this.data, x, ...y)) {
      throw new Error(`AreaChart: wrong attributes x:${x}, y:${y.join(',')}`)
    }
    if (!isArrayOfType(scale, 'number', 2)) {
      throw new Error('AreaChart: wrong scale format')
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
    this._initReactiveProperty()
    this.vm = new VueAreaChart({
      data: {
        id: this.id,
        data: this.data.value,
        x: this.x.value,
        y: this.y.value,
        scale: this.scale.value,
        selection: this.selection.value,
      },
      watch: {
        data(val) {
          // TODO this.checkXY()
          this.scale = getDataExtent(val, this.x)
          this.selection = val
        },
      },
    })

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

  _initReactiveProperty() {
    // set被调用时，**这个**可视化该做什么
    this.data = new ReactiveProperty(
      this,
      'data',
      this.data,
      '_onDataChange',
      'replace data'
    )
    this.x = new ReactiveProperty(this, 'x', this.x, '_onXChange', 'encode')
    this.y = new ReactiveProperty(this, 'y', this.y, '_onYChange', 'encode')
    this.scale = new ReactiveProperty(
      this,
      'scale',
      this.scale,
      '_onScaleChange',
      'navigate',
      'ranges'
    )
    this.selection = new ReactiveProperty(
      this,
      'selection',
      this.selection,
      '_onSelectionChange',
      'select'
    )
  }

  _onDataChange(val) {
    if (!Array.isArray(val)) {
      throw new TypeError(`AreaChart: expect data to be Array, got ${val}`)
    }
    this.vm.data = val
  }

  _onXChange(val) {
    if (typeof val !== 'string') {
      throw new TypeError(`AreaChart: expect x to be string, got ${val}`)
    }
    this.vm.x = val
  }

  _onYChange(val) {
    if (typeof val !== 'string') {
      throw new TypeError(`AreaChart: expect y to be string, got ${val}`)
    }
    this.vm.y = val
  }

  _onScaleChange(val) {
    if (isArrayOfType(val, 'number', 2)) {
      throw new TypeError(`AreaChart: expect scale to be number[2]`)
    }
    this.vm.scale = val
  }

  _onSelectionChange(val) {
    if (!Array.isArray(val)) {
      throw new TypeError(`AreaChart: expect selection to be Array, got ${val}`)
    }

    this.vm.selection = val
  }
}
