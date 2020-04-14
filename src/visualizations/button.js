import * as d3 from 'd3'
import ReactiveProperty from '../reactive-prop'

export default class Button {
  constructor(props) {
    this.text = props.text || ''
    // this.clicked = props.clicked || false
    this.clicked = false

    this.el = null

    this._init()
  }

  _init() {
    this.text = new ReactiveProperty(this, 'text', this.text, '_onTextSet')
    this.clicked = new ReactiveProperty(
      this,
      'clicked',
      this.clicked,
      '_onClickedSet'
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
      .append('button')
      .style('width', '70%')
      .text(this.text.value)
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

  _onClickedSet() {}
}