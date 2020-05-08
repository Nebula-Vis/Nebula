import * as d3 from 'd3'
import ReactiveProperty from '@/reactive-prop'
import VueBarCahrt from './vue-bar-chart'
import { getFieldsOfType } from '@/utils'
export default class BarCahrt {
  constructor(props) {
    this.id = props.id
    this.data = props.data
    const numericFields = getFieldsOfType(this.data, 'number')
    const x = props.x || numericFields[0]
    const y =
      props.y ||
      (props.stacked
        ? numericFields.filter((field) => field !== x)
        : numericFields[1])
    const selection = props.selection || this.data
    let color = props.color || d3.schemeSet2[0]
    if (props.stacked && !Array.isArray(props.color)) color = d3.schemeSet2

    this.x = x
    this.y = y
    this.aggregate =
      props.aggregate || (props.stacked ? y.map((item) => 'count') : 'count')
    this.scaleY = props.scaleY || (props.stacked ? y.map((item) => 1) : 1)
    this.count = props.count
    this.bottomEdge = props.bottomEdge || 'bottom'
    this.color = color
    this.selectionColor = props.selectionColor || color
    this.stacked = props.stacked
    this.isDisplay = props.isDisplay
    const defaultMargin = {
      top: 20,
      right: 20,
      bottom: 35,
      left: 30,
      between: 1,
    }
    this.margin = { ...defaultMargin, ...props.margin }

    this.selection = selection
    this.selectedXRange = props.selectedXRange || {}
    this.xRange = props.xRange || []
    this.el = null
    this.vm = null

    this._init()
  }

  mount(el) {
    if (typeof el === 'string' && !el.startsWith('#')) {
      el = `#${el}`
    }
    this.el = d3
      .select(el)
      .append('div')
      .style('position', 'relative')
      .style('box-sizing', 'border-box')
      .style('width', '100%')
      .style('height', '100%')
      .style('user-select', 'none')
      .node()
    this.vm.$mount(this.el)
  }

  _init() {
    this._initReactiveProperty()
    this.vm = new VueBarCahrt({
      data: {
        id: this.id,
        data: this.data.get(),
        selection: this.selection.get(),
        selectedXRange: this.selectedXRange.get(),
        xRange: this.xRange.get(),
        margin: this.margin,
        encoding: {
          x: this.x.get(),
          y: this.y.get(),
          aggregate: this.aggregate.get(),
          scaleY: this.scaleY,
          stacked: this.stacked,
          color: this.color,
          count: this.count,
          selectionColor: this.selectionColor,
          bottomEdge: this.bottomEdge,
          isDisplay: this.isDisplay,
        },
      },
      watch: {
        data(val) {
          this.selection = []
          this.selectedXRange = {}
        },
      },
    })
    this.vm.$on('selection', (val) => {
      this.selection.set(val)
    })
    this.vm.$on('selectedXRange', (val) => {
      this.selectedXRange.set(val)
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
    this.aggregate = new ReactiveProperty(
      this,
      'aggregate',
      this.aggregate,
      '_onAggregateChange',
      'encode',
      'aggregate'
    )
    this.count = new ReactiveProperty(
      this,
      'count',
      this.count,
      '_onCountChange',
      'encode',
      'count'
    )
    this.selection = new ReactiveProperty(
      this,
      'selection',
      this.selection,
      '_onSelectionChange',
      'select',
      'items'
    )
    this.selectedXRange = new ReactiveProperty(
      this,
      'selectedXRange',
      this.selectedXRange,
      '_onSelectedXRangeChange',
      'select',
      'ranges'
    )
    this.xRange = new ReactiveProperty(
      this,
      'xRange',
      this.xRange,
      '_onXRangeChange',
      'navigate',
      'ranges'
    )
  }

  _onDataChange(val) {
    if (!Array.isArray(val)) {
      throw new TypeError(`BarChart: expect data to be Array, got ${val}`)
    }
    this.vm.data = val
  }

  _onAggregateChange(val) {
    if (typeof val !== 'string') {
      throw new TypeError(`BarChart: expect x to be string, got ${val}`)
    }
    this.vm.aggregate = val
  }

  _onCountChange(val) {
    if (typeof val !== 'number') {
      throw new TypeError(`BarChart: expect x to be number, got ${val}`)
    }
    this.vm.count = val
  }

  _onXChange(val) {
    if (typeof val !== 'string') {
      throw new TypeError(`BarChart: expect x to be string, got ${val}`)
    }
    this.vm.x = val
  }

  _onYChange(val) {
    if (
      typeof val !== 'string' &&
      Object.prototype.toString.call(val) !== '[object Array]'
    ) {
      throw new TypeError(`BarChart: expect y to be string, got ${val}`)
    }
    this.vm.encoding.y = val
  }

  _onSelectionChange(val) {
    if (!Array.isArray(val)) {
      throw new TypeError(`BarChart: expect selection to be Array, got ${val}`)
    }
    this.vm.selection = val
  }

  _onSelectedXRangeChange(val) {
    // if (!Array.isArray(val)) {
    //   throw new TypeError(
    //     `BarChart: expect selectedXRange to be Array, got ${val}`
    //   )
    // }
    this.vm.selectedXRange = val
  }

  _onXRangeChange(val) {
    // if (!Array.isArray(val)) {
    //   throw new TypeError(
    //     `BarChart: expect selectedXRange to be Array, got ${val}`
    //   )
    // }
    this.vm.xRange = val
  }
}
