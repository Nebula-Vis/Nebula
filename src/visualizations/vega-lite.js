import * as d3 from 'd3'
import embed, { vega } from 'vega-embed'
import _ from 'lodash'
import ReactiveProperty from '../reactive-prop'
import { getFieldsOfType, padExtent, getDataExtent } from '../utils'

export default class VegaLite {
  constructor(spec) {
    this.id = spec.id
    this.spec = spec
    this.spec.data.name = this.spec.data.name || 'data'
    if (this.spec.width === undefined) {
      this.spec.width = 'container'
    }
    if (this.spec.height === undefined) {
      this.spec.height = 'container'
    }
    // // this.spec.autosize = {
    //   type: 'fit',
    //   resize: true,
    //   contains: 'padding',
    // }

    this.data = null
    this.x = this.spec.encoding.x.field
    this.y = this.spec.encoding.y.field

    this.view = null
    this.el = null
    this.dataName = this.spec.data.name

    this._initReactiveProps()
  }

  _initReactiveProps() {
    this.data = new ReactiveProperty(
      this,
      'data',
      this.spec.data.values,
      '_onDataSet',
      'replace data'
    )
    if (this.spec.selection) {
      const data = this.data.get()
      Object.entries(this.spec.selection).forEach(([name, spec]) => {
        const selectionValue =
          spec.empty && spec.empty === 'none'
            ? []
            : spec.type === 'interval'
            ? this._getScale(data, this.x, this.y)
            : data

        this[`selection${name}`] = new ReactiveProperty(
          this,
          `selection${name}`,
          selectionValue,
          `_onSelection${name}Set`,
          'select',
          spec.type === 'interval' ? 'ranges' : 'items'
        )
      })
    }
  }

  async mount(el) {
    this.el = this._getElNode(el)
    this.view = (await embed(this.el, this.spec, { actions: false })).view
    this._addReactivePropInternalUpdateListeners()
    this._addOnReactivePropertySetListeners()
  }

  _getElNode(el) {
    if (typeof el === 'string' && !el.startsWith('#')) {
      el = `#${el}`
    }
    return d3
      .select(el)
      .append('div')
      .style('position', 'relative')
      .style('box-sizing', 'border-box')
      .style('width', '100%')
      .style('height', '100%')
      .node()
  }

  _addReactivePropInternalUpdateListeners() {
    Object.entries(this.spec.selection).forEach(([name, spec]) => {
      this.view.addDataListener(`${name}_store`, (n, rawValue) => {
        // console.log(
        //   this.view.getState({
        //     data: vega.truthy,
        //     signals: vega.falsy,
        //     recurse: true,
        //   }).data
        // )
        let value = null
        if (['single', 'multi'].includes(spec.type)) {
          value = this._convertVegaLiteItemSelectionToItemSelection(
            rawValue,
            this.data.get()
          )
        } else if (spec.type === 'interval') {
          value = this._convertVegaLiteIntervalSelectionToRangesSelection(
            rawValue
          )
        }
        spec._value = value
        spec._rawValue = rawValue.map((v) => ({ ...v }))
        this[`selection${name}`].set(value)
      })
    })
  }

  _addOnReactivePropertySetListeners() {
    Object.entries(this.spec.selection).forEach(([name, spec]) => {
      this[`_onSelection${name}Set`] = function (val) {
        if (spec._value === val) return
        let value = null
        switch (spec.type) {
          case 'single':
            value = this._convertItemSelectionToVegaLiteItemSelection(
              val,
              this.data.get()
            ).slice(0, 1)
            break
          case 'multi':
            value = this._convertItemSelectionToVegaLiteItemSelection(
              val,
              this.data.get()
            )
            break
          case 'interval':
            value = this._convertRangeSelectionToVegaLiteIntervalSelection(val)
            break
          default:
            break
        }
        this.view.data(`${name}_store`, value)
        this.view.runAsync()
      }.bind(this)
    })
  }

  async _onDataSet(data) {
    this.view.data(this.dataName, data)
    await this.view.runAsync()
    // TODO update selection, scale?
  }

  _convertVegaLiteItemSelectionToItemSelection(vegeLiteSelectionValue, data) {
    return vegeLiteSelectionValue
      .filter((v) => v.values && v.values[0])
      .map((v) => data[v.values[0] - 1])
  }

  _convertItemSelectionToVegaLiteItemSelection(selection, data) {
    return selection.map((item) => ({
      fields: [{ type: 'E', field: '_vgsid_' }],
      values: [data.findIndex((d) => d._nbid_ === item._nbid_) + 1],
    }))
  }

  _convertVegaLiteIntervalSelectionToRangesSelection(vegaLiteSelectionValue) {
    if (!vegaLiteSelectionValue.length) return []
    const { fields, values } = vegaLiteSelectionValue[0]
    const ranges = {}
    fields.forEach((field, i) => {
      let [min, max] = values[i]
      if (field.channel === 'y') [min, max] = [max, min]
      ranges[field.field] = [min, max]
    })
    return ranges
  }

  _convertRangeSelectionToVegaLiteIntervalSelection(selection) {
    const validRanges = Object.entries(selection).filter(([field, range]) =>
      this._getChannelFromField(field)
    )

    const fields = validRanges.map(([field]) => ({
      field: field,
      channel: this._getChannelFromField(field),
      type: 'R',
    }))
    const values = validRanges.map(([field, range]) => {
      if (this._getChannelFromField(field) === 'y') {
        return [range[1], range[0]]
      }
      return range
    })
    return [
      {
        unit: '',
        fields,
        values,
      },
    ]
  }

  _getScale(data, x, y) {
    return {
      [x]: padExtent(getDataExtent(data, x), 0.2),
      [y]: padExtent(getDataExtent(data, y), 0.2),
    }
  }

  _getChannelFromField(field) {
    const matchingChannel = Object.entries(this.spec.encoding).find(
      ([channel, spec]) => spec.field === field
    )
    if (matchingChannel) {
      return matchingChannel[0]
    }
    return undefined
  }
}
