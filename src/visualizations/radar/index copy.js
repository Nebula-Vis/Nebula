import * as d3 from 'd3'
import ReactiveProperty from '@/reactive-prop'
export default class Radar {
  constructor(props) {
    this.id = props.id
    this.data = props.data
    this.color = props.encoding && props.encoding.color
    this.el = null
    this._init()
  }

  _renderSVG() {
    const table = this.data.get()
    const that = this
    const stokenColor = this.color || 'steelblue'
    const { clientWidth: width, clientHeight: height } = this.el
    const innerRadius = (120 / 960) * width
    const outerRadius = height / 2 - 10
    const svg = d3
      .create('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `${-width / 2} ${-height / 2} ${width} ${height}`)
      .style('width', '60%')
    const parallel = svg.append('g')
    const x = d3.scalePoint().range([0, width]).padding(1)
    const y = {}
    let dimensions = []
    x.domain(
      (dimensions = d3.keys(table[0]).filter(
        (d) => (
          (y[d] = d3
            .scaleLinear()
            .domain(d3.extent(table, (p) => +p[d]))
            .range([height, 0])),
          !['name', '_nbid_'].includes(d)
        )
      ))
    )

    d3.axisLeft()
      .scale(
        d3.scaleLinear().domain([0, 140]).range([-innerRadius, -outerRadius])
      )
      .ticks(7)

    // Render unhighlight
    // parallel
    //   .append('g')
    //   .style('fill', 'none')
    //   .style('stroke', '#ddd')
    //   .style('shape-rendering', 'crispEdges')
    //   .selectAll('path')
    //   .data(table)
    //   .enter()
    //   .append('path')
    //   .attr('d', (d) => d3.line()(dimensions.map((p) => [x(p), y[p](d[p])])))
    // const foreground = parallel
    //   .append('g')
    //   .style('fill', 'none')
    //   .style('stroke', stokenColor)
    //   .selectAll('path')
    //   .data(table)
    //   .enter()
    //   .append('path')
    //   .attr('d', (d) => d3.line()(dimensions.map((p) => [x(p), y[p](d[p])])))

    // // Add a group element for each dimension.
    // const g = parallel
    //   .selectAll('.dimension')
    //   .data(dimensions)
    //   .enter()
    //   .append('g')
    //   .attr('class', 'dimension')
    //   .attr('transform', (d) => (console.log(d), `translate(${x(d)}) `))
    //   .attr('transform', (d) => `rotate(${(x(d) * 180) / Math.PI})`)

    // // Add an axis and title.
    // g.append('g')
    //   .attr('class', 'axis')
    //   .each(function (d) {
    //     d3.select(this).call(d3.axisLeft().scale(y[d]))
    //   })
    //   .append('text')
    //   .style('fill', 'black')
    //   .style(
    //     'text-shadow',
    //     '0 1px 0 #fff, 1px 0 0 #fff, 0 -1px 0 #fff, -1px 0 0 #fff;'
    //   )
    //   .style('text-anchor', 'middle')
    //   .attr('y', -9)
    //   .text((d) => d)

    // // Add and store a brush for each axis.
    // g.append('g')
    //   .attr('class', 'brush')
    //   .each(function (d) {
    //     d3.select(this).call(
    //       (y[d].brush = d3
    //         .brushY()
    //         .extent([
    //           [-10, 0],
    //           [10, height],
    //         ])
    //         .on('brush', brush)
    //         .on('end', brush))
    //     )
    //   })
    //   .selectAll('rect')
    //   .attr('x', -8)
    //   .attr('width', 16)

    // // Handles a brush event, toggling the display of foreground lines.
    // function brush() {
    //   const actives = []
    //   svg
    //     .selectAll('.brush')
    //     .filter(function (d) {
    //       y[d].brushSelectionValue = d3.brushSelection(this)
    //       return d3.brushSelection(this)
    //     })
    //     .each(function (d) {
    //       // Get extents of brush along each active selection axis (the Y axes)
    //       actives.push({
    //         dimension: d,
    //         extent: d3.brushSelection(this).map(y[d].invert),
    //       })
    //     })

    //   const selected = []
    //   // Update foreground to only display selected values
    //   foreground.style('display', (d) =>
    //     actives.every(
    //       (active) =>
    //         active.extent[1] <= d[active.dimension] &&
    //         d[active.dimension] <= active.extent[0]
    //     )
    //       ? (selected.push(d), null)
    //       : 'none'
    //   )

    //   that.selection.set(selected)
    // }
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
}
