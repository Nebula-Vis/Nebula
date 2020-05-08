import * as d3 from 'd3'
import ReactiveProperty from '@/reactive-prop'
export default class Radar {
  constructor(props) {
    this.id = props.id
    this.data = props.data
    this.color = (props.encoding && props.encoding.color) || d3.schemeSet2[0]
    this.selection = props.selection || []
    this.el = null
    this._init()
  }

  _renderSVG() {
    const table = this.data.get()
    const that = this
    const stokenColor = this.color || d3.schemeSet2[1]
    const { clientWidth: width, clientHeight: height } = this.el
    const radius = Math.min(width, height) / 2 - 10
    const svg = d3
      .create('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `${-width / 2} ${-height / 2} ${width} ${height}`)

    const radial = svg.append('g').attr('transform', 'scale(0.48)')
    const x = d3
      .scalePoint()
      .range([0, 2 * Math.PI])
      .padding(0.5)

    //
    const y = {}
    let dimensions = []
    x.domain(
      (dimensions = d3.keys(table[0]).filter(
        (d) => (
          (y[d] = d3
            .scaleLinear()
            .domain(
              (([min, max, padding = 0.05 * Math.abs(min - max)]) => [
                max + padding,
                min - padding,
              ])(d3.extent(table, (p) => +p[d]))
            )
            .range([0, height])),
          !['name', '_nbid_'].includes(d)
        )
      ))
    )

    const line = d3.lineRadial().curve(d3.curveCardinalClosed)
    // Render unhighlight
    radial
      .append('g')
      .style('fill', 'none')
      .style('stroke', '#ddd')
      .style('shape-rendering', 'crispEdges')
      .selectAll('path')
      .data(table)
      .enter()
      .append('path')
      .attr('d', (d) => line(dimensions.map((p) => [x(p), y[p](d[p])])))
    const foreground = radial
      .append('g')
      .style('fill', 'none')
      .style('stroke', stokenColor)
      .selectAll('path')
      .data(table)
      .enter()
      .append('path')
      .attr('d', (d) => line(dimensions.map((p) => [x(p), y[p](d[p])])))

    // Add a group element for each dimension.
    const g = radial
      .selectAll('.dimension')
      .data(dimensions)
      .enter()
      .append('g')
      .attr('class', 'dimension')
      .attr('transform', (d) => `rotate(${(x(d) * 180) / Math.PI + 180})`)
      .style('user-select', 'none')

    // Add an axis and title.
    g.append('g')
      .attr('class', 'axis')
      .each(function (d) {
        d3.select(this).call(d3.axisLeft().scale(y[d]))
      })
      .style('font-size', '20px')
      .append('text')
      .style('fill', 'black')
      .style(
        'text-shadow',
        '0 1px 0 #fff, 1px 0 0 #fff, 0 -1px 0 #fff, -1px 0 0 #fff;'
      )
      .style('text-anchor', 'middle')
      .attr('y', height + 18)
      .text((d) => d)

    // Add and store a brush for each axis.
    g.append('g')
      .attr('class', 'brush')
      .each(function (d) {
        d3.select(this).call(
          (y[d].brush = d3
            .brushY()
            .extent([
              [-10, 0],
              [10, height],
            ])
            .on('brush', brush)
            .on('end', brush))
        )
      })
      .selectAll('rect')
      .attr('x', -8)
      .attr('width', 16)

    // Handles a brush event, toggling the display of foreground lines.
    function brush() {
      const actives = []
      svg
        .selectAll('.brush')
        .filter(function (d) {
          y[d].brushSelectionValue = d3.brushSelection(this)
          return d3.brushSelection(this)
        })
        .each(function (d) {
          // Get extents of brush along each active selection axis (the Y axes)
          actives.push({
            dimension: d,
            extent: d3.brushSelection(this).map(y[d].invert),
          })
        })

      const selected = []
      // Update foreground to only display selected values
      foreground.style('display', (d) =>
        actives.every(
          (active) =>
            active.extent[1] <= d[active.dimension] &&
            d[active.dimension] <= active.extent[0]
        )
          ? (selected.push(d), null)
          : 'none'
      )

      that.selection.set(selected)
    }
    return svg.node()
  }

  _init() {
    // set被调用时，**这个**可视化该做什么
    this.data = new ReactiveProperty(
      this,
      'data',
      this.data,
      '_onDataChange',
      'set',
      'data'
    )
    this.selection = new ReactiveProperty(
      this,
      'selection',
      this.selection,
      '_onSelectionChange',
      'select',
      'items'
    )
  }
  mount(el) {
    if (typeof el === 'string' && !el.startsWith('#')) el = `#${el}`

    this.el = d3
      .select(el)
      .append('div')
      .style('position', 'relative')
      .style('box-sizing', 'border-box')
      .style('width', '100%')
      .style('height', '100%')
      .style('overflow', 'auto')
      .node()

    this.el.appendChild(this._renderSVG())
  }
  _onDataChange() {
    this.el.removeChild(this.el.children[0])
    this.el.appendChild(this._renderSVG())
  }
}
