import * as d3 from 'd3'
import ReactiveProperty from '@/reactive-prop'

export default class DangerousHtml {
  constructor(props) {
    this.html = props.html || '<div>111</div>'
    this.el = null
    this._init()
  }

  _init() {
    this.html = new ReactiveProperty(
      this,
      'text',
      this.html,
      '_onHtmlChange',
      'set',
      'value'
    )
  }

  mount(el) {
    if (typeof el === 'string' && !el.startsWith('#')) el = `#${el}`

    this.el = d3.select(el).node()
    d3.select(this.el)
      .style('width', '100%')
      .style('height', '100%')
      .style('position', 'relative')
      .style('overflow', 'hidden')
      .append('div')
      .html(this.html.get())
  }

  _onHtmlChange(val) {
    this.el.removeChild(this.el.children[0])
    d3.select(this.el).append('div').html(this.html.get())
  }
}
