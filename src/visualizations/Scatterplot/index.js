import * as d3 from 'd3'
import ReactiveProperty from '../../nebula/reactive_prop'
import VueScatterplot from './vue_scatterplot'

export default class Scatterplot {
  constructor(props) {
    this.data = props.data

    const x = props.x || getIthFieldOfType(this.data, 0, 'number')
    const y = props.y || getIthFieldOfType(this.data, 1, 'number')
    const scale = isArrayOfType(props.scale, 'number', 2, 2)
      ? props.scale
      : getAxisDomainsFromData(this.data, x, y)
    const selection = props.selection || getIdsFromData(this.data)

    if (!boolDataHasAttribute(this.data, x, y)) {
      throw 'Scatterplot: wrong attributes'
    }
    if (!isArrayOfType(scale, 'number', 2, 2)) {
      throw 'Scatterplot: wrong scale'
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
      el = '#' + el
    }
    this.el = d3.select(el).append('div').node()
    this.vm.$mount(this.el)
  }

  _init() {
    this.vm = new VueScatterplot({
      data: {
        id: this.id,
        data: this.data,
        x: this.x,
        y: this.y,
        selection: this.selection,
        scale: this.scale,
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
}

function getIthFieldOfType(data, n, type) {
  if (data.length === 0) {
    return undefined
  }
  const datum = data[0]
  if (typeof datum !== 'object') {
    return undefined
  }
  let count = 0
  for (const key of Object.keys(datum).sort()) {
    if (typeof datum[key] === type && count++ === n) {
      return key
    }
  }
}

function isArrayOfType(array, type, col, row) {
  if (!array) return false
  if (row === 1 && array.length > 1) {
    array = [array]
  }
  return (
    Array.isArray(array) &&
    array.length === row &&
    array.every((r) => {
      return (
        Array.isArray(r) &&
        r.length === col &&
        r.every((c) => typeof c === type)
      )
    })
  )
}

function boolDataHasAttribute(data, ...attrNames) {
  const datum = data[0]
  return datum && attrNames.every((attrName) => datum[attrName] !== undefined)
}

function getIdsFromData(data) {
  return data.map((d) => d._nbid_)
}

function getDataExtent(data, key) {
  return d3.extent(data, (d) => d[key])
}

function getAxisDomainsFromData(data, x, y) {
  return [getDataExtent(data, x), getDataExtent(data, y)]
}