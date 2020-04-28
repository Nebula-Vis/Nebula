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
    this.areasData = props.areasData
    this.selectedArea = props.selectedArea || []

    const numericFields = getFieldsOfType(this.data, 'number')
    const x = props.x || numericFields[0]
    const y = props.y || numericFields[1]
    const selection = props.selection || []
    if (!boolDataHasAttributes(this.data, x, y)) {
      throw new Error(`Map: wrong attributes x:${x}, y:${y}`)
    }

    this.x = x
    this.y = y
    this.color = props.color
    this.size = props.size
    this.brushType = props.brushType
    this.bottomEdge = props.bottomEdge
    this.mapStyle = props.mapStyle
    this.events = props.events
    this.selection = selection
    this.dataInWindow = []
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
        areasData: this.areasData.get(),
        selectedArea: this.selectedArea.get(),
        encoding: {
          x: this.x.get(),
          y: this.y.get(),
          color: this.color.get(),
          size: this.size.get(),
          brushType: this.brushType.get(),
          bottomEdge: this.bottomEdge.get(),
          mapStyle: this.mapStyle.get(),
          events: this.events.get(),
        },
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
    this.vm.$on('dataInWindow', (val) => {
      this.dataInWindow.set(val)
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
    this.areasData = new ReactiveProperty(
      this,
      'areasData',
      this.areasData,
      '_onAreasDataChange',
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
    this.color = new ReactiveProperty(
      this,
      'color',
      this.color,
      '_onColorChange',
      'encode',
      'color'
    )
    this.size = new ReactiveProperty(
      this,
      'size',
      this.size,
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
    this.events = new ReactiveProperty(
      this,
      'events',
      this.events,
      '_onEventsChange',
      'encode',
      'type'
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
    this.dataInWindow = new ReactiveProperty(
      this,
      'dataInWindow',
      this.dataInWindow,
      '_onDataInWindowChange',
      'select',
      'items'
    )
  }

  _onDataChange(val) {
    if (!Array.isArray(val)) {
      throw new TypeError(`Map: expect data to be Array, got ${val}`)
    }
    this.vm.data = val
  }

  _onAreasDataChange(val) {
    if (!Array.isArray(val)) {
      throw new TypeError(`Map: expect data to be Array, got ${val}`)
    }
    this.vm.areasData = val
  }

  _onXChange(val) {
    if (typeof val !== 'string') {
      throw new TypeError(`Map: expect x to be string, got ${val}`)
    }
    this.vm.x = val
  }

  _onYChange(val) {
    if (typeof val !== 'string') {
      throw new TypeError(`Map: expect y to be string, got ${val}`)
    }
    this.vm.y = val
  }

  _onColorChange(val) {
    if (typeof val !== 'string') {
      throw new TypeError(`Map: expect y to be string, got ${val}`)
    }
    this.vm.color = val
  }

  _onSizeChange(val) {
    if (typeof val !== 'string') {
      throw new TypeError(`Map: expect y to be string, got ${val}`)
    }
    this.vm.size = val
  }

  _onBrushTypeChange(val) {
    if (typeof val !== 'string') {
      throw new TypeError(`Map: expect y to be string, got ${val}`)
    }
    this.vm.brushType = val
  }

  _onBottomEdgeChange(val) {
    if (typeof val !== 'string') {
      throw new TypeError(`Map: expect y to be string, got ${val}`)
    }
    this.vm.bottomEdge = val
  }

  _onMapStyleChange(val) {
    if (Object.prototype.toString.call(val) !== '[object Object]') {
      throw new TypeError(`Map: expect y to be object, got ${val}`)
    }
    this.vm.mapStyle = val
  }

  _onEventsChange(val) {
    if (!Array.isArray(val)) {
      throw new TypeError(`Map: expect events to be array, got ${val}`)
    }
    this.vm.events = val
  }

  _onSelectedAreaChange(val) {
    if (!Array.isArray(val)) {
      throw new TypeError(`Map: expect selection to be Array, got ${val}`)
    }

    this.vm.selectedArea = val
  }

  _onSelectionChange(val) {
    if (!Array.isArray(val)) {
      throw new TypeError(`Map: expect selection to be Array, got ${val}`)
    }

    this.vm.selection = val
  }

  _onDataInWindowChange(val) {
    this.vm._onDataInWindowChange = val
  }

  _isValidScale(scale, x) {
    return scale && isArrayOfType(scale[x], 'number', 2)
  }

  _getScale(data, x) {
    return { [x]: getDataExtent(data, x) }
  }
}
