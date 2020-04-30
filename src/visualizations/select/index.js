import * as d3 from 'd3'
import ReactiveProperty from '@/reactive-prop'

export default class Select {
  constructor(props) {
    this.id = props.id
    this.label = props.label
    this.options = props.options || []
    this.selected = props.selected || null

    this.el = null

    this._init()
  }

  _init() {
    this.options = new ReactiveProperty(
      this,
      'options',
      this.options,
      '_onOptionsSet',
      'set'
    )
    this.selected = new ReactiveProperty(
      this,
      'selected',
      this.selected,
      '_onSelectedSet',
      'set',
      'value'
    )
  }

  mount(el) {
    if (typeof el === 'string' && !el.startsWith('#')) {
      el = `#${el}`
    }
    this.el = d3.select(el).node()

    const flexContainer = d3
      .select(this.el)
      .style('padding', '0 20px')
      .style('display', 'flex')
      .style('flex-direction', 'column')
      .style('align-items', 'center')
    // .style('justify-content', 'center')

    if (this.label) {
      flexContainer
        .append('div')
        .style('width', '100%')
        .append('label')
        .text(this.label)
    }

    flexContainer
      .append('div')
      .style('width', '100%')
      .append('select')
      .style('width', '100%')
      .node()
      .addEventListener('change', (event) => {
        this.selected.set(event.target.value)
      })

    this._renderOptions(this.options.get())
  }

  _renderOptions(options) {
    if (!this.el) return

    d3.select(this.el)
      .select('select')
      .selectAll('option')
      .data(options)
      .join('option')
      .attr('value', (d) => d)
      .attr('selected', (d) => (d === this.selected.get() ? true : null))
      .text((d) => d)
  }

  _onOptionsSet(val) {
    this._renderOptions(val)
  }

  _onSelectedSet(val) {
    const selected = d3
      .select(this.el)
      .selectAll('option')
      .filter(function () {
        return d3.select(this).attr('value') === val
      })
      .node()

    if (!selected) {
      throw new Error(`Select: no such option ${val}`)
    }

    d3.select(this.el).selectAll('option').attr('selected', null)

    d3.select(selected).attr('selected', true)
  }
}
