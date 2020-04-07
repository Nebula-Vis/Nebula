import * as d3 from 'd3'
import * as LineUpJS from 'lineupjs'
import 'lineupjs/build/LineUpJS.css'
import _ from 'lodash'
import ReactiveProperty from '../nebula/reactive_prop'

export default class LineUp {
  constructor(props) {
    this.id = props.id
    this.el = props.el

    this.data = props.data.values || []
    this.selection = props.selection || []
    this.order = props.order || []

    this.lineup = null
    this._selection = null
    this._order = null

    this._init()
  }

  _init() {
    this._buildLineUp()
    this.data = new ReactiveProperty(this, 'data', this.data, '_onDataChange')
    this.selection = new ReactiveProperty(
      this,
      'selection',
      this.selection,
      '_onSelectionChange'
    )
    this.order = new ReactiveProperty(
      this,
      'order',
      this.order,
      '_onOrderChange'
    )

    this.lineup.on('selectionChanged', (val) => {
      const nbids = val
        .filter((index) => !!this.data.value[index])
        .map((index) => this.data.value[index]._nbid_)
      this._selection = nbids
      this.selection.set(nbids)
    })

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

  _buildLineUp() {
    const builder = this._getDataBuilder(this.data, this.order)

    builder.defaultRanking()
    builder.sidePanel(false)
    builder.rowHeight(20, 2)

    this.lineup = builder.build(d3.select(this.el).node())
  }

  _onDataChange(val) {
    const datum = val[0]
    const order = this.order.value.filter(attr => datum[attr] !== undefined)
    const builder = this._getDataBuilder(val, order)
    this.lineup.setDataProvider(builder.buildData())
    this.lineup.setSelection(
      this.selection.value.map((nbid) =>
        val.findIndex((v) => v._nbid_ === nbid)
      )
    )
  }

  _onSelectionChange(val) {
    if (_.isEqual(val, this._selection)) return
    const data = this.data.value
    const selection = val
      .map((nbid) => data.findIndex((v) => v._nbid_ === nbid))
      // .filter((i) => i !== -1)
    this.lineup.setSelection(selection)
  }

  _onOrderChange(val) {
    if (_.isEqual(val, this._order)) return
    const ranking = this.lineup.data.getFirstRanking()
    val
      .map((attr) => ranking.children.find((c) => c.desc.column === attr))
      // .filter((column) => column)
      .forEach((column, i) => {
        ranking.move(column, i + 4)
      })
  }

  _getDataBuilder(data, order) {
    const builder = LineUpJS.builder(data)

    const colors = d3.scaleOrdinal(d3.schemeSet2)
    builder.column(
      LineUpJS.buildStringColumn('_nbid_').label('id').width(150).frozen()
    )
    order.forEach((attr, i) => {
      builder.column(LineUpJS.buildNumberColumn(attr).color(colors(i)))
    })

    return builder
  }
}
