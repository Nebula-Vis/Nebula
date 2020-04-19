import * as d3 from 'd3'
import * as LineUpJS from 'lineupjs'
import 'lineupjs/build/LineUpJS.css'
import _ from 'lodash'
import { getFieldsOfType, padExtent } from '../utils'
import ReactiveProperty from '../reactive-prop'

export default class LineUp {
  constructor(props) {
    this.id = props.id
    this.data = props.data || []
    this.selection = props.selection || this.data
    this.order = props.order || getFieldsOfType(this.data, 'number')

    this.el = null
    this.lineup = null
    this._selection = null
    this._order = null
    this._data = null

    this.colors = d3.scaleOrdinal(d3.schemeSet2)

    this._init()
  }

  mount(el) {
    if (typeof el === 'string' && !el.startsWith('#')) {
      el = `#${el}`
    }
    el = d3.select(el).node()
    const rect = el.getBoundingClientRect()
    this.el = d3
      .select(el)
      .append('div')
      .style('width', `${rect.width}px`)
      .style('height', `${rect.height}px`)
      .node()

    this._addLineUpStyle()
    this._buildLineUp()
    this._addDataListener()
    this._addSelectionListener()
    this._addOrderListener()
  }

  _init() {
    this.data = new ReactiveProperty(
      this,
      'data',
      this.data,
      '_onDataSet',
      'replace data'
    )
    this.selection = new ReactiveProperty(
      this,
      'selection',
      this.selection,
      '_onSelectionSet',
      'select'
    )
    this.order = new ReactiveProperty(
      this,
      'order',
      this.order,
      '_onOrderSet',
      'reconfigure',
      'order'
    )
  }

  _buildLineUp() {
    const builder = this._getDataBuilder(this.data.get(), this.order.get())

    builder.defaultRanking()
    builder.sidePanel(false)
    builder.rowHeight(21, 1)

    this.lineup = builder.build(this.el)
  }

  _getDataBuilder(data, order) {
    const builder = LineUpJS.builder(data)

    order.forEach((attr) => {
      const extent = d3.extent(data, (d) => d[attr])
      builder.column(
        LineUpJS.buildNumberColumn(attr, padExtent(extent, 0.2)).color(
          this.colors(attr)
        )
      )
    })

    return builder
  }

  _onDataSet(data) {
    if (_.isEqual(data, this._data)) return
    const datum = data[0]
    const order = this.order.get().filter((attr) => datum[attr] !== undefined)
    const builder = this._getDataBuilder(data, order)
    this.lineup.setDataProvider(builder.buildData())

    const dataMap = new Map()
    data.forEach((d, i) => {
      dataMap.set(d._nbid_, i)
    })

    this.lineup.setSelection(
      this.selection.get().map((datum) => dataMap.get(datum._nbid_))
    )
    this._addDataListener()
    this._addOrderListener()
  }

  _onSelectionSet(selection) {
    // if (_.isEqual(selection, this._selection)) return
    if (selection === this._selection) return
    const data = this.data.get()

    const dataMap = new Map()
    data.forEach((d, i) => {
      dataMap.set(d._nbid_, i)
    })

    this.lineup.setSelection(
      selection.map((datum) => dataMap.get(datum._nbid_))
    )
  }

  _onOrderSet(order) {
    if (_.isEqual(order, this._order)) return
    if (!Array.isArray(order)) {
      order = JSON.parse(order)
    }
    const ranking = this.lineup.data.getFirstRanking()
    const columns = ranking.children
    order
      .map((attr) => columns.find((c) => c.desc.column === attr))
      // .filter((column) => column)
      .forEach((column, i) => {
        ranking.move(column, i + 4)
      })
  }

  _addDataListener() {
    const lineupData = this.lineup.data
    const ranking = lineupData.getFirstRanking()
    let isNewlyFiltered = false
    ranking.on('filterChanged', () => {
      isNewlyFiltered = true
    })

    lineupData.on('orderChanged', (prev, cur) => {
      if (!isNewlyFiltered) return
      isNewlyFiltered = false
      const data = this.data.get().filter((d, i) => cur.includes(i))
      this._data = data
      this.data.set(data)
    })
  }

  _addSelectionListener() {
    this.lineup.on('selectionChanged', (selectedIndices) => {
      const data = this.data.get()
      const selection = selectedIndices
        .filter((index) => !!data[index])
        .map((index) => data[index])
      this._selection = selection
      this.selection.set(selection)
    })
  }

  _addOrderListener() {
    this.lineup.data.getFirstRanking().on(
      'moveColumn',
      _.debounce(() => {
        const order = this.lineup.data
          .getFirstRanking()
          .children.slice(4)
          .map((c) => c.desc.column)
        this._order = order
        this.order.set(order)
      }, 50)
    )
  }

  _addLineUpStyle() {
    const styleId = 'custom-lineup-style'
    if (d3.select(`#${styleId}`).size()) return

    const style = document.createElement('style')
    style.innerHTML = `
      .lu-row [data-id^=col] {
        overflow-y: hidden;
      }
      .lineup-engine>main {
        overflow: -moz-scrollbars-none;
        -ms-overflow-style: none;
      }
      .lineup-engine>main::-webkit-scrollbar {
        width: 0 !important
      }
    `
    style.id = styleId
    document.body.appendChild(style)
  }
}
