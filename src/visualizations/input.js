import * as d3 from 'd3'
import { debounce } from 'lodash'
import ReactiveProperty from '../reactive-prop'

export default class Input {
  constructor(props) {
    this.value = props.value || ''

    this.el = null

    this._init()
  }

  _init() {
    this.value = new ReactiveProperty(this, 'value', this.value, '_onValueSet')
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
      .append('input')
      .attr('value', this.value.value)
      .node()
      .addEventListener(
        'input',
        debounce((event) => {
          this.value.set(event.target.value)
        }, 500)
      )
  }

  _onValueSet(val) {
    d3.select(this.el).select('input').attr('value', val)
  }
}
