import * as d3 from 'd3'
import ReactiveProperty from '../../reactive-prop'
import VueScatterplot from './vue_scatterplot'
import {
  getFieldsOfType,
  isArrayOfType,
  getDataExtent,
  boolDataHasAttributes,
  padExtent,
} from '../../utils'

export default class Scatterplot {
  constructor(props) {
    const numericFields = getFieldsOfType(props.data, 'number')
    const x = props.x || numericFields[0]
    const y = props.y || numericFields[1]
    const scale = isArrayOfType(props.scale, 'number', 2, 2)
      ? props.scale
      : this._getScale(props.data, x, y)
    const selection = props.selection || props.data

    if (!boolDataHasAttributes(props.data, x, y)) {
      throw new Error(`Scatterplot: wrong attributes x:${x}, y:${y}`)
    }
    if (!isArrayOfType(scale, 'number', 2, 2)) {
      throw new Error('Scatterplot: wrong scale format')
    }

    this.data = props.data
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

    const that = this
    this.vm = new VueScatterplot({
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
          this.scale = that._getScale(val, this.x, this.y)
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
      throw new TypeError(`Scatterplot: expect data to be Array, got ${val}`)
    }
    this.vm.data = val
  }

  _onXChange(val) {
    if (typeof val !== 'string') {
      throw new TypeError(`Scatterplot: expect x to be string, got ${val}`)
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
    if (isArrayOfType(val, 'number', 2, 2)) {
      throw new TypeError(`Scatterplot: expect scale to be number[2][2]`)
    }
    this.vm.scale = val
  }

  _onSelectionChange(val) {
    if (!Array.isArray(val)) {
      throw new TypeError(
        `Scatterplot: expect selection to be Array, got ${val}`
      )
    }

    this.vm.selection = val
  }

  _getScale(data, x, y) {
    return [getDataExtent(data, x), getDataExtent(data, y)].map((extent) =>
      padExtent(extent, 0.2)
    )
  }
}
