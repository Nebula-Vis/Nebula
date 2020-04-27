import * as d3 from 'd3'
import ReactiveProperty from '@/reactive-prop'
import VueSunburstChart from '@/visualizations/sunburst-chart/vue-sunburst-chart'

export default class SunburstChart {
  constructor(props) {
    this.id = props.id || new Date() - 0
    this.data = props.data.hierarchy

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

    this.vm = new VueSunburstChart({
      data: {
        id: this.id,
        data: this.data.get(),
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
      throw new TypeError(`Sunburstchart: expect data to be Array, got ${val}`)
    }
    this.vm.data = val
  }

  _onSelectionChange(val) {
    if (typeof val !== 'string') {
      throw new TypeError(`Sunburstchart: expect y to be string, got ${val}`)
    }
    this.vm.selection = JSON.parse(val)[0]
  }
}
