import * as d3 from 'd3'
import ReactiveProperty from '../../reactive-prop'
import VueMap from './map'
import {
  getFieldsOfType,
  isArrayOfType,
  getDataExtent,
  boolDataHasAttributes,
} from '../../utils'

export default class Map {
  constructor(props) {
    this.id = props.id || new Date() - 0
    this.data = props.data
    this.selectedArea = props.selectedArea || {}

    const numericFields = getFieldsOfType(this.data, 'number')
    const x = props.x || numericFields[0]
    const y = props.y || numericFields[1]
    if (!boolDataHasAttributes(this.data, x, y)) {
      throw new Error(`Map: wrong attributes x:${x}, y:${y}`)
    }

    this.x = x
    this.y = y
    this.circleColor = props.circleColor || d3.schemeSet2[0]
    this.colorField = props.colorField
    this.sizeField = props.sizeField
    this.brushType = props.brushType
    this.bottomEdge = props.bottomEdge
    this.mapStyle = props.mapStyle
    this.selection = props.selection || props.data
    this.visibleData = []
    this.visibleRange = {}
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
    this.vm = new VueMap({
      data: {
        id: this.id,
        mapData: this.data.get(),
        selectedArea: this.selectedArea.get(),
        encoding: {
          x: this.x.get(),
          y: this.y.get(),
          circleColor: this.circleColor,
          color: this.colorField.get(),
          size: this.sizeField.get(),
          brushType: this.brushType.get(),
          bottomEdge: this.bottomEdge.get(),
          mapStyle: this.mapStyle.get(),
        },
        selection: this.selection.get(),
      },
      watch: {
        data(val) {
          // TODO this.checkXY()
          this.scale = that._getScale(val, this.x)
          this.selection = val
        },
      },
    })

    // 只在直接用户交互时触发
    // 会propagate到subscribers
    this.vm.$on('data', (val) => {
      this.data.set(val)
    })
    this.vm.$on('visibleData', (val) => {
      this.visibleData.set(val)
    })
    this.vm.$on('visibleRange', (val) => {
      this.visibleRange.set(val)
    })
    this.vm.$on('selection', (val) => {
      this.selection.set(val)
    })
    this.vm.$on('selectedArea', (val) => {
      this.selectedArea.set(val)
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
    this.colorField = new ReactiveProperty(
      this,
      'colorField',
      this.colorField,
      '_onColorChange',
      'encode',
      'color'
    )
    this.sizeField = new ReactiveProperty(
      this,
      'sizeField',
      this.sizeField,
      '_onSizeChange',
      'encode',
      'size'
    )
    this.brushType = new ReactiveProperty(
      this,
      'brushType',
      this.brushType,
      '_onBrushTypeChange',
      'encode',
      'type'
    )
    this.bottomEdge = new ReactiveProperty(
      this,
      'bottomEdge',
      this.bottomEdge,
      '_onBottomEdgeChange',
      'encode',
      'size'
    )
    this.mapStyle = new ReactiveProperty(
      this,
      'mapStyle',
      this.mapStyle,
      '_onMapStyleChange',
      'encode',
      'style'
    )
    this.selectedArea = new ReactiveProperty(
      this,
      'selectedArea',
      this.selectedArea,
      '_onSelectedAreaChange',
      'select',
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
    this.visibleData = new ReactiveProperty(
      this,
      'visibleData',
      this.visibleData,
      '_onVisibleDataChange',
      'navigate',
      'items'
    )
    this.visibleRange = new ReactiveProperty(
      this,
      'visibleRange',
      this.visibleRange,
      '_onVisibleRangeChange',
      'navigate',
      'ranges'
    )
  }

  _onDataChange(val) {
    if (!Array.isArray(val)) {
      throw new TypeError(`Map: expect data to be Array, got ${val}`)
    }
    this.vm.data = val
  }

  _onXChange(val) {
    if (typeof val !== 'string') {
      throw new TypeError(`Map: expect x to be string, got ${val}`)
    }
    this.vm.encoding.x = val
  }

  _onYChange(val) {
    if (typeof val !== 'string') {
      throw new TypeError(`Map: expect y to be string, got ${val}`)
    }
    this.vm.encoding.y = val
  }

  _onColorChange(val) {
    if (typeof val !== 'string') {
      throw new TypeError(`Map: expect y to be string, got ${val}`)
    }
    this.vm.encoding.colorField = val
  }

  _onSizeChange(val) {
    if (typeof val !== 'string') {
      throw new TypeError(`Map: expect y to be string, got ${val}`)
    }
    this.vm.encoding.size = val
  }

  _onBrushTypeChange(val) {
    if (typeof val !== 'string') {
      throw new TypeError(`Map: expect y to be string, got ${val}`)
    }
    this.vm.encoding.brushType = val
  }

  _onBottomEdgeChange(val) {
    if (typeof val !== 'string') {
      throw new TypeError(`Map: expect y to be string, got ${val}`)
    }
    this.vm.encoding.bottomEdge = val
  }

  _onMapStyleChange(val) {
    if (Object.prototype.toString.call(val) !== '[object Object]') {
      throw new TypeError(`Map: expect y to be object, got ${val}`)
    }
    this.vm.encoding.mapStyle = val
  }

  _onSelectedAreaChange(val) {
    // if (!Array.isArray(val)) {
    //   throw new TypeError(`Map: expect selection to be Array, got ${val}`)
    // }

    this.vm.selectedArea = val
  }

  _onSelectionChange(val) {
    if (!Array.isArray(val)) {
      throw new TypeError(`Map: expect selection to be Array, got ${val}`)
    }

    this.vm.selection = val
  }

  _onVisibleDataChange(val) {
    this.vm.visibleData = val
  }

  _onVisibleRangeChange(val) {
    this.vm.visibleRange = val
  }

  _isValidScale(scale, x) {
    return scale && isArrayOfType(scale[x], 'number', 2)
  }

  _getScale(data, x) {
    return { [x]: getDataExtent(data, x) }
  }
}
