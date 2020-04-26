import * as d3 from 'd3'
import ReactiveProperty from '../../reactive-prop'
import VueHeatmap2D from './vue-heatmap-2D'
import {
  getFieldsOfType,
  isArrayOfType,
  getDataExtent,
  boolDataHasAttributes,
} from '../../utils'

export default class Heatmap2D {
  constructor(props) {
    this.id = props.id || new Date() - 0
    this.data = props.data
    this.encoding = props.encoding
    const numericFields = getFieldsOfType(this.data, 'number')
    const x = this.encoding.x || numericFields[0]
    const y = this.encoding.y || numericFields[1]
    const z = this.encoding.z || numericFields[2]
    const selection = props.selection || []
    if (!boolDataHasAttributes(this.data, x, y, z)) {
      throw new Error(`BarChart: wrong attributes x:${x}, y:${y}, z:${z}`)
    }

    this.selection = selection
    this.x = x
    this.y = y
    this.z = z
    this.aggregate = props.aggregate || 'count'
    this.countX = this.encoding.countX
    this.countY = this.encoding.countY
    this.color = this.encoding.color
    this.bgColor = this.encoding.bgColor
    this.axisSwitch = this.encoding.axisSwitch
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
    this.vm = new VueHeatmap2D({
      data: {
        id: this.id,
        data: this.data.get(),
        encoding: this.encoding,
        aggregate: this.aggregate.get(),
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
    this.bgColor = new ReactiveProperty(
      this,
      'bgColor',
      this.bgColor,
      '_onBgColorChange',
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
    this.z = new ReactiveProperty(
      this,
      'z',
      this.z,
      '_onZChange',
      'encode',
      'z'
    )
    this.aggregate = new ReactiveProperty(
      this,
      'aggregate',
      this.aggregate,
      '_onAggregateChange',
      'encode',
      'aggregate'
    )
    this.countX = new ReactiveProperty(
      this,
      'countX',
      this.countX,
      '_onCountXChange',
      'encode',
      'x'
    )
    this.countY = new ReactiveProperty(
      this,
      'countY',
      this.countY,
      '_onCountYChange',
      'encode',
      'y'
    )
    this.axisSwitch = new ReactiveProperty(
      this,
      'axisSwitch',
      this.axisSwitch,
      '_onAxisSwitchChange',
      'encode',
      'type'
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

  _onBgColorChange(val) {
    if (typeof val !== 'string') {
      throw new TypeError(`AreaChart: expect x to be string, got ${val}`)
    }
    this.vm.bgColor = val
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

  _onZChange(val) {
    if (typeof val !== 'string') {
      throw new TypeError(`AreaChart: expect y to be string, got ${val}`)
    }
    this.vm.z = val
  }

  _onAggregateChange(val) {
    if (typeof val !== 'string') {
      throw new TypeError(`AreaChart: expect y to be string, got ${val}`)
    }
    this.vm.aggregate = val
  }

  _onCountXChange(val) {
    this.vm.countX = val
  }

  _onCountYChange(val) {
    this.vm.countY = val
  }

  _onAxisSwitchChange(val) {
    this.vm.axisSwitch = val
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
