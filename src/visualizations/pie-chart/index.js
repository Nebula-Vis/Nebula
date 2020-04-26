import * as d3 from 'd3'
import ReactiveProperty from '@/reactive-prop'
import VuePieChart from '@/visualizations/pie-chart/vue-pie-chart'

export default class PieChart {
  constructor(props) {
    this.id = props.id || new Date() - 0
    this.data = props.data

    this.x = props.range
    this.y = props.value

    const selection = props.selection || null

    this.selection = selection

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
    this.vm = new VuePieChart({
      data: {
        id: this.id,
        data: this.data.get(),
        name: this.x.get(),
        value: this.y.get(),
        selection: this.selection.get(),
      },
      watch: {
        data(val) {
          this.selection = val
        },
      },
    })

    // 只在直接用户交互时触发
    // 会propagate到subscribers
    this.vm.$on('data', (val) => {
      this.data.set(val)
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

  _onSelectionChange(val) {
    if (typeof val !== 'string') {
      throw new TypeError(`SectorChart: expect y to be string, got ${val}`)
    }
    this.vm.selection = JSON.parse(val)
  }
}
