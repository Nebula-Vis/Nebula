import * as d3 from 'd3'
import ReactiveProperty from '../reactive-prop'

export default class Select {
  constructor(props) {
    this.options = props.options || []
    this.selected = props.selected || ''

    this.el = null

    this._init()
  }

  _init() {
    this.options = new ReactiveProperty(
      this,
      'options',
      this.options,
      '_onOptionsSet'
    )
    this.selected = new ReactiveProperty(
      this,
      'selected',
      this.selected,
      '_onSelectedSet'
    )
  }

  mount(el) {
    if (typeof el === 'string' && !el.startsWith('#')) {
      el = `#${el}`
    }
    this.el = d3.select(el).node()

    d3.select(this.el)
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('justify-content', 'center')
      .append('select')
      .node()
      .addEventListener('change', (event) => {
        this.selected.set(event.target.value)
      })

    this._renderOptions(this.options.value)
  }

  _renderOptions(options) {
    if (!this.el) return

    d3.select(this.el)
      .select('select')
      .selectAll('option')
      .data(options)
      .join('option')
      .attr('value', (d) => d)
      .text((d) => d)
  }

  _onOptionsSet(val) {
    this._renderOptions(val)
  }

  _onSelectedSet(val) {
    d3.select(this.el)
      .selectAll('option')
      .attr('selected', null)
      .filter((d) => d === val)
      .attr('selected', true)
  }
}
