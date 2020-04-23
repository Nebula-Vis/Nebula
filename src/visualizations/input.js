import * as d3 from 'd3'
import { debounce } from 'lodash'
import ReactiveProperty from '../reactive-prop'

export default class Input {
  constructor(props) {
    this.id = props.id
    this.value = props.value || ''

    this.el = null

    this._init()
  }

  _init() {
    this.value = new ReactiveProperty(
      this,
      'value',
      this._parseString(this.value),
      '_onValueSet',
      'set'
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
      .node()
      .addEventListener(
        // 'input',
        // debounce((event) => {
        //   this.value.set(event.target.value)
        // }, 500)
        'keyup',
        (event) => {
          if (event.key === 'Enter') {
            this.value.set(this._parseString(event.target.value))
          }
        }
      )
    this._onValueSet(this.value.get())
  }

  _onValueSet(val) {
    d3.select(this.el).select('input').attr('value', this._stringify(val))
  }

  _stringify(val) {
    try {
      return JSON.stringify(val)
    } catch (error) {
      return val
    }
  }

  _parseString(str) {
    try {
      return JSON.parse(str)
    } catch (error) {
      return str
    }
  }
}
