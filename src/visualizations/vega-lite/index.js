import * as d3 from 'd3'
import embed, { vega } from 'vega-embed'
import _ from 'lodash'
import ReactiveProperty from '@/reactive-prop'
import { padExtent, getDataExtent } from '@/utils'

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
      'set'
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
    if (this.spec.selection) this._addReactivePropInternalUpdateListeners()
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
    if (!this.spec.selection) return
    Object.entries(this.spec.selection).forEach(([name, spec]) => {
      this.view.addDataListener(`${name}_store`, (n, rawValue) => {
        // log all data
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
        this[`selection${name}`].set(value)
      })
    })
  }

  _addOnReactivePropertySetListeners() {
    if (!this.spec.selection) return
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
    console.log('ondataset', data)
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
    if (!vegaLiteSelectionValue.length) return {}
    const { fields, values } = vegaLiteSelectionValue[0]
    const ranges = {}
    fields.forEach((field, i) => {
      const spec = this.spec.encoding[field.channel]
      const fieldName = spec.timeUnit
        ? field.field.substring(field.field.indexOf('_') + 1)
        : field.field

      let processedRange = values[i]
      if (processedRange[0] > processedRange[1]) {
        processedRange = [...processedRange].reverse()
      }
      ranges[fieldName] = processedRange
    })
    return ranges
  }

  _convertRangeSelectionToVegaLiteIntervalSelection(selection) {
    const validRanges = Object.entries(selection).filter(([field, range]) =>
      this._getChannelFromField(field)
    )

    const fields = validRanges.map(([field]) =>
      this._convertExternalFieldToVegaLiteField(field)
    )

    const values = validRanges.map(([field, range], i) =>
      this._convertExternalRangeToVageLiteIntervalValue(
        field,
        range,
        fields[i].field
      )
    )
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

  _isInRangeInclusive(value, min, max) {
    if (!isNaN(+value) && !isNaN(+min) && !isNaN(+max)) {
      return +value >= +min && +value <= +max
    }
    // TODO
    return value >= min && value <= max
  }

  _convertExternalFieldToVegaLiteField(field) {
    const channel = this._getChannelFromField(field)
    const spec = this.spec.encoding[channel]

    return {
      field: spec.timeUnit ? `${spec.timeUnit}_${field}` : field,
      channel,
      type: spec.type === 'quantitative' ? 'R' : 'E',
    }
  }

  _convertExternalRangeToVageLiteIntervalValue(field, range, fieldName) {
    const channel = this._getChannelFromField(field)
    const spec = this.spec.encoding[channel]
    const marks = this.view.data('marks')
    let processedRange = range

    // TODO
    if (
      (spec.channel === 'y' && range[0] < range[1]) ||
      (spec.channel !== 'y' && range[0] > range[1])
    ) {
      processedRange = [...range].reverse()
    }
    if (spec.type === 'quantitative') {
      return processedRange
    } else if (spec.type === 'ordinal') {
      // TODO
      const min = processedRange[0]
      const max = processedRange[processedRange.length - 1]
      const filtered = marks.filter((mark) =>
        this._isInRangeInclusive(mark.datum[fieldName], min, max)
      )
      const mapped = filtered.map((mark) => mark.datum[fieldName])
      return mapped
    } else {
      // TODO
      return []
    }
  }
}
