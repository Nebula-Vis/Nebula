import * as d3 from 'd3'
import ReactiveProperty from '../../nebula/reactive-prop'
import VueScatterplot from './vue_scatterplot'
import {
  getFieldsOfType,
  isArrayOfType,
  getDataExtent,
  getNbidsFromData,
  boolDataHasAttributes,
  padExtent,
} from '../../utils'

export default class Scatterplot {
  constructor(props) {
    this.data = props.data

    const numericFields = getFieldsOfType(this.data, 'number')
    const x = props.x || numericFields[0]
    const y = props.y || numericFields[1]
    const scale = isArrayOfType(props.scale, 'number', 2, 2)
      ? props.scale
      : this._getScale(this.data, x, y)
    const selection = props.selection || getNbidsFromData(this.data)

    if (!boolDataHasAttributes(this.data, x, y)) {
      throw new Error('Scatterplot: wrong attributes')
    }
    if (!isArrayOfType(scale, 'number', 2, 2)) {
      throw new Error('Scatterplot: wrong scale')
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
    const that = this
    this.vm = new VueScatterplot({
      data: {
        id: this.id,
        data: this.data,
        x: this.x,
        y: this.y,
        selection: this.selection,
        scale: this.scale,
      },
      watch: {
        data(val) {
          // TODO
          // this.checkXY()
          this.scale = that._getScale(val, this.x, this.y)
          this.selection = getNbidsFromData(val)
        },
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

  _getScale(data, x, y) {
    return [getDataExtent(data, x), getDataExtent(data, y)].map((extent) =>
      padExtent(extent, 0.2)
    )
  }
}
