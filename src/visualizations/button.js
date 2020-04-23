import * as d3 from 'd3'
import ReactiveProperty from '../reactive-prop'

export default class Button {
  constructor(props) {
    this.id = props.id
    this.text = props.text || ''
    this.clicked = props.clicked || false

    this.el = null

    this._init()
  }

  _init() {
    this.text = new ReactiveProperty(
      this,
      'text',
      this.text,
      '_onTextSet',
      'set'
    )
    this.clicked = new ReactiveProperty(this, 'clicked', this.clicked, '')
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
      .append('button')
      .style('width', '70%')
      .text(this.text.get())
      .node()
      .addEventListener('click', () => {
        this.clicked.set(true)
        setTimeout(() => {
          this.clicked.set(false)
        }, 50)
      })
  }

  _onTextSet(val) {
    d3.select(this.el).select('button').text(val)
  }
}
