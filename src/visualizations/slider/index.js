import * as d3 from 'd3'
import ReactiveProperty from '../../reactive-prop'

export default class Slider {
  constructor(props) {
    this.id = props.id
    this.min = props.min
    this.max = props.max
    this.value = props.value || this.min

    this.el = null

    this._init()
  }

  _init() {
    this.min = new ReactiveProperty(this, 'min', this.min, '_onMinSet')
    this.max = new ReactiveProperty(this, 'max', this.max, '_onMaxSet')
    this.value = new ReactiveProperty(
      this,
      'value',
      this.value,
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

    d3.select(this.el)
      .style('display', 'flex')
      .style('flex-direction', 'column')
      .style('align-items', 'center')
      .style('justify-content', 'center')

    d3.select(this.el)
      .append('div')
      .style('width', '70%')
      .append('div')
      .style('position', 'relative')
      .attr('class', 'value')
      .style(
        'left',
        `${
          ((this.value.get() - this.min.get()) /
            (this.max.get() - this.min.get())) *
          100
        }%`
      )
      .html(this.value.get())

    d3.select(this.el)
      .append('div')
      .style('width', '70%')
      .append('input')
      .attr('class', 'nb-slider')
      .attr('type', 'range')
      .attr('min', this.min.get())
      .attr('max', this.max.get())
      .attr('step', 0.01)
      .attr('value', this.value.get())
      .node()
      .addEventListener('input', (event) => {
        this.value.set(event.target.value)
      })
    const div = d3
      .select(this.el)
      .append('div')
      .style('width', '70%')
      .style('display', 'flex')
      .style('justify-content', 'space-between')
    div.append('span').attr('class', 'min-value').html(this.min.get())
    div.append('span').attr('class', 'max-value').html(this.max.get())
    this._styleSlider()
  }

  _onValueSet(val) {
    d3.select(this.el).select('input').attr('value', val)
    d3.select(this.el)
      .select('.value')
      .html(val)
      .style(
        'left',
        `${((val - this.min.get()) / (this.max.get() - this.min.get())) * 100}%`
      )
  }

  _onMinSet(val) {
    d3.select(this.el).select('input').attr('min', val)
    d3.select(this.el).select('.min-value').html(val)
  }

  _onMaxSet(val) {
    d3.select(this.el).select('input').attr('max', val)
    d3.select(this.el).select('.max-value').html(val)
  }

  _styleSlider() {
    const styleId = 'nb-slider-style'
    if (d3.select(`#${styleId}`).size()) return

    const style = document.createElement('style')
    style.innerHTML = `
    .nb-slider {
      -webkit-appearance: none;
      width: 100%;
      height: 5px;
      border-radius: 5px;
      background: #ddd;
      outline: none;
      opacity: 0.7;
      -webkit-transition: .2s;
      transition: opacity .2s;
    }

    .nb-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 15px;
      height: 15px;
      border-radius: 50%;
      border: 1px solid #aaa;
      background: #ccc;
      cursor: pointer;
    }

    .nb-slider::-moz-range-thumb {
      width: 15px;
      height: 15px;
      border-radius: 50%;
      border: 1px solid #aaa;
      background: #ccc;
      cursor: pointer;
    }
    `
    style.id = styleId
    document.body.appendChild(style)
  }
}
