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
    this.value = new ReactiveProperty(
      this,
      'value',
      this.value,
      '_onValueSet',
      'replace data'
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
      .append('input')
      .style('width', '70%')
      .attr('value', this.value.get())
      .node()
      .addEventListener(
        // 'input',
        // debounce((event) => {
        //   this.value.set(event.target.value)
        // }, 500)
        'keyup',
        (event) => {
          if (event.key === 'Enter') {
            this.value.set(event.target.value)
          }
        }
      )
  }

  _onValueSet(val) {
    d3.select(this.el).select('input').attr('value', val)
  }
}
