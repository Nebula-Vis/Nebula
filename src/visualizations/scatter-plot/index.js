import * as d3 from 'd3'
import ReactiveProperty from '@/reactive-prop'
import VueScatterplot from './vue-scatterplot'
import {
  getFieldsOfType,
  isArrayOfType,
  getDataExtent,
  boolDataHasAttributes,
  padExtent,
} from '@/utils'

export default class Scatterplot {
  constructor(props) {
    this.id = props.id || new Date() - 0
    const numericFields = getFieldsOfType(props.data, 'number')
    const x = props.x || numericFields[0]
    const y = props.y || numericFields[1]
    let scale = this._getScale(props.data)
    if (this._isValidScale(props.scale, x, y)) {
      scale = { ...scale, ...props.scale }
    }
    if (!boolDataHasAttributes(props.data, x, y)) {
      throw new Error(`Scatterplot: wrong attributes x:${x}, y:${y}`)
    }
    if (!this._isValidScale(scale, x, y)) {
      throw new Error('Scatterplot: wrong scale format')
    }

    this.data = props.data
    this.x = x
    this.y = y
    this.scale = scale
    this.selection = props.selection || props.data
    this.size = props.size === undefined ? 4 : +props.size
    this.color = props.color || d3.schemeSet2[0]
    this.alternateColor = props.alternateColor || d3.schemeSet2[7]
    this.filteredData = props.filteredData || []

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
    this.vm = new VueScatterplot({
      data: {
        id: this.id,
        data: this.data.get(),
        x: this.x.get(),
        y: this.y.get(),
        scale: this.scale.get(),
        selection: this.selection.get(),
        size: this.size.get(),
        color: this.color.get(),
        alternateColor: this.alternateColor,
      },
      watch: {
        data(val) {
          // TODO this.checkXY()
          this.scale = that._getScale(val)
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
      'navigate',
      'ranges'
    )
    this.selection = new ReactiveProperty(
      this,
      'selection',
      this.selection,
      '_onSelectionChange',
      'select',
      'items'
    )
    this.size = new ReactiveProperty(
      this,
      'size',
      this.size,
      '_onSizeChange',
      'encode',
      'size'
    )
    this.color = new ReactiveProperty(
      this,
      'color',
      this.color,
      '_onColorChange',
      'encode',
      'color'
    )
    this.filteredData = new ReactiveProperty(
      this,
      'filteredData',
      this.filteredData,
      '_onFilteredDataChange',
      'filter',
      'items'
    )
  }

  _onDataChange(val) {
    if (!Array.isArray(val)) {
      throw new TypeError(`Scatterplot: expect data to be Array, got ${val}`)
    }
    this.vm.data = val
  }

  _onXChange(val) {
    if (typeof val !== 'string' || !this._isValidNumericField(val)) {
      throw new TypeError(
        `Scatterplot: expect x to be a numeric field of data, got ${val}`
      )
    }
    this.vm.x = val
  }

  _onYChange(val) {
    if (typeof val !== 'string') {
      throw new TypeError(`Scatterplot: expect y to be string, got ${val}`)
    }
    this.vm.y = val
  }

  _onScaleChange(val) {
    if (!this._isValidScale(val, this.x.get(), this.y.get())) {
      // throw new TypeError(`Scatterplot: _onScaleChange, wrong scale format`)
      console.error(`Scatterplot: _onScaleChange, wrong scale format`)
      return
    }
    this.vm.scale = val
  }

  _onSelectionChange(val) {
    if (!Array.isArray(val)) {
      throw new TypeError(
        `Scatterplot: expect selection to be Array, got ${val}`
      )
    }

    this.vm.color = this.color.get()
    this.vm.alternateColor = this.alternateColor
    this.vm.selection = val
  }

  _onSizeChange(val) {
    this.vm.size = val
  }

  _onColorChange(val) {
    this.vm.color = val
  }

  _onFilteredDataChange(val) {
    if (!Array.isArray(val)) {
      throw new TypeError(
        `Scatterplot: expect filteredData to be Array, got ${val}`
      )
    }
    this.vm.alternateColor = this.color.get()
    this.vm.color = this.alternateColor
    this.vm.selection = val
  }

  _getScale(data) {
    const numericFields = getFieldsOfType(data, 'number')
    const scale = {}
    numericFields.forEach((field) => {
      scale[field] = padExtent(getDataExtent(data, field), 0.2)
    })
    return scale
  }

  _isValidScale(scale, x, y) {
    return (
      scale &&
      isArrayOfType(scale[x], 'number', 2) &&
      isArrayOfType(scale[y], 'number', 2)
    )
  }

  _isValidNumericField(field) {
    return getFieldsOfType(this.data.get(), 'number').includes(field)
  }
}
