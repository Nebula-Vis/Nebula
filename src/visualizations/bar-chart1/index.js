import * as d3 from 'd3'
import ReactiveProperty from '../../reactive-prop'
import VueBarChart from './vue-bar-chart'
import {
  getFieldsOfType,
  isArrayOfType,
  getDataExtent,
  boolDataHasAttributes,
} from '../../utils'

export default class BarChart {
  constructor(props) {
    this.id = props.id || new Date() - 0
    this.data = props.data
    this.color = props.color || '#4e79a7'
    this.selectionColor = props.selectionColor || '#3fca2f'
    const numericFields = getFieldsOfType(this.data, 'number')
    const x = props.x || numericFields[0]
    const y = props.y || numericFields.filter((field) => field !== x)
    const scale = this._isValidScale(props.scale, x)
      ? props.scale
      : this._getScale(this.data, x)
    const selection = props.selection || this.data
    if (!boolDataHasAttributes(this.data, x, ...y)) {
      throw new Error(`BarChart: wrong attributes x:${x}, y:${y.join(',')}`)
    }
    if (!this._isValidScale(scale, x)) {
      throw new Error('BarChart: wrong scale format')
    }

    this.x = x
    this.y = y
    this.scale = scale
    this.selection = selection

    // this.id = new Date().toLocaleString()
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
    const that = this
    this.vm = new VueBarChart({
      data: {
        id: this.id,
        data: this.data.get(),
        color: this.color.get(),
        selectionColor: this.selectionColor.get(),
        x: this.x.get(),
        y: this.y.get(),
        scale: this.scale.get(),
        selection: this.selection.get(),
      },
      watch: {
        data(val) {
          // TODO this.checkXY()
          this.scale = that._getScale(val, this.x)
          // this.selection = val
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
  }

  _initReactiveProperty() {
    // set被调用时，**这个**可视化该做什么
    this.data = new ReactiveProperty(
      this,
      'data',
      this.data,
      '_onDataChange',
      'set',
      'data'
    )
    this.color = new ReactiveProperty(
      this,
      'color',
      this.color,
      '_onColorChange',
      'encode',
      'color'
    )
    this.selectionColor = new ReactiveProperty(
      this,
      'selectionColor',
      this.selectionColor,
      '_onSelectionColorChange',
      'encode',
      'color'
    )
    this.x = new ReactiveProperty(
      this,
      'x',
      this.x,
      '_onXChange',
      'encode',
      'x'
    )
    this.y = new ReactiveProperty(
      this,
      'y',
      this.y,
      '_onYChange',
      'encode',
      'y'
    )
    this.scale = new ReactiveProperty(
      this,
      'scale',
      this.scale,
      '_onScaleChange',
      'navigate'
    )
    this.selection = new ReactiveProperty(
      this,
      'selection',
      this.selection,
      '_onSelectionChange',
      'select',
      'items'
    )
  }

  _onDataChange(val) {
    if (!Array.isArray(val)) {
      throw new TypeError(`AreaChart: expect data to be Array, got ${val}`)
    }
    this.vm.data = val
  }

  _onSelectionColorChange(val) {
    if (typeof val !== 'string') {
      throw new TypeError(`AreaChart: expect x to be string, got ${val}`)
    }
    this.vm.selectionColor = val
  }

  _onColorChange(val) {
    if (typeof val !== 'string') {
      throw new TypeError(`AreaChart: expect x to be string, got ${val}`)
    }
    this.vm.color = val
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
    if (this._isValidScale(val, this.x.get())) {
      throw new TypeError(`AreaChart: wrong scale format`)
    }
    this.vm.scale = val
  }

  _onSelectionChange(val) {
    if (!Array.isArray(val)) {
      throw new TypeError(`AreaChart: expect selection to be Array, got ${val}`)
    }

    this.vm.selection = val
  }

  _isValidScale(scale, x) {
    return scale && isArrayOfType(scale[x], 'number', 2)
  }

  _getScale(data, x) {
    return { [x]: getDataExtent(data, x) }
  }
}
