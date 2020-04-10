import * as d3 from 'd3'
import ReactiveProperty from '../nebula/reactive-prop'

export default class D3Scatterplot {
  constructor(props) {
    this.id = props.id
    this.el = props.el
    this.data = props.data.values
    this.x = props.x
    this.y = props.y
    this.scales = []

    this.margin = 30
    this.svg = null

    this._init()
  }

  _init() {
    this.svg = d3
      .select(this.el)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')

    const domains = [
      [
        d3.min(this.data, (d) => d[this.x]),
        d3.max(this.data, (d) => d[this.x]),
      ],
      [
        d3.min(this.data, (d) => d[this.y]),
        d3.max(this.data, (d) => d[this.y]),
      ],
    ]

    const rect = this.svg.node().getBoundingClientRect()
    const width = rect.width - 2 * this.margin
    const height = rect.height - 2 * this.margin
    const ranges = [
      [this.margin, this.margin + width],
      [this.margin + height, this.margin],
    ]

    this.scales = [
      d3.scaleLinear().domain(domains[0]).range(ranges[0]),
      d3.scaleLinear().domain(domains[1]).range(ranges[1]),
    ]

    this.svg
      .append('g')
      .attr('transform', `translate(0, ${ranges[1][0]})`)
      .call(d3.axisBottom(this.scales[0]))
    this.svg
      .append('g')
      .attr('transform', `translate(${ranges[0][0]}, 0)`)
      .call(d3.axisLeft(this.scales[1]))

    this.svg
      .selectAll('circle')
      .data(this.data)
      .enter()
      .append('circle')
      .attr('cx', (d) => this.scales[0](d[this.x]))
      .attr('cy', (d) => this.scales[1](d[this.y]))
      .attr('r', 4)
      .style('fill', 'green')

    this.svg.append('g').call(
      d3
        .brush()
        .extent([
          [this.margin, this.margin],
          [width + this.margin, height + this.margin],
        ])
        .on('brush', this.brushed.bind(this))
    )

    this.selection = new ReactiveProperty(
      this,
      'selection',
      this.data.map((v, i) => i + 1),
      '_renderSelection'
    )
  }

  brushed() {
    const brushRange = d3.event.selection

    const selection = this.data.filter((d) => {
      const posX = this.scales[0](d[this.x])
      const posY = this.scales[1](d[this.y])

      return (
        posX >= brushRange[0][0] &&
        posX <= brushRange[1][0] &&
        posY >= brushRange[0][1] &&
        posY <= brushRange[1][1]
      )
    })
    const selectionIds = selection.map((d) => d.id)
    this.selection.set(selectionIds)
  }

  // 根据ID
  _renderSelection(selection) {
    this.svg.selectAll('circle').style('fill', (d) => {
      return selection.indexOf(d.id) !== -1 ? 'green' : '#aaa'
    })
  }
}
