import * as d3 from 'd3'
import ReactiveProperty from '@/reactive-prop'

export default class Input {
  constructor(props) {
    this.id = props.id
    this.value = props.value || ''
    this.label = props.label

    this.el = null

    this._init()
  }

  _init() {
    this.value = new ReactiveProperty(
      this,
      'value',
      this._parseString(this.value),
      '_onValueSet',
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
      .append('input')
      .style('width', '100%')
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
