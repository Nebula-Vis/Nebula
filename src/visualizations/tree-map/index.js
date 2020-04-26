import * as d3 from 'd3'
import ReactiveProperty from '@/reactive-prop'
export default class TreeMap {
  constructor(props) {
    this.id = props.id
    this.data = props.data.hierarchy
    this.nodeId = props.nodeId || Object.keys(props.data.nodes[0])[0] || 'id'
    this.tile = (props.encoding && props.encoding.tile) || 'treemapBinary'
    this.el = null

    this._init()
  }

  _renderSVG() {
    const { clientWidth: width, clientHeight: height } = this.el
    console.log(width)
    const format = d3.format(',d')
    const color = d3.scaleOrdinal(d3.schemeCategory10)
    const hierarchy = d3
      .hierarchy(this.data.get())
      .sum((d) => d.value)
      .sort((a, b) => b.value - a.value)

    const root = d3
      .treemap()
      .tile(d3.treemapBinary)
      .size([width, height])
      .padding(1)
      .round(true)(hierarchy)
    const svg = d3
      .create('svg')
      .attr('viewBox', [0, 0, width, height])
      .style('font', '10px sans-serif')

    const leaf = svg
      .selectAll('g')
      .data(root.leaves())
      .join('g')
      .attr('transform', (d) => `translate(${d.x0},${d.y0})`)

    leaf.append('title').text(
      (d) =>
        `${d
          .ancestors()
          .reverse()
          .map((d) => d.data.name)
          .join('/')}\n${format(d.value)}`
    )

    leaf
      .append('rect')
      .attr('id', (d) => `${d.data._nbid_}_rect`)
      .attr('fill', (d) => {
        while (d.depth > 1) d = d.parent
        return color(d.data.name)
      })
      .attr('fill-opacity', 0.6)
      .attr('width', (d) => d.x1 - d.x0)
      .attr('height', (d) => d.y1 - d.y0)

    leaf
      .append('clipPath')
      .attr('id', (d) => `${d.data._nbid_}_clipPath`)
      .append('use')
    // .attr('xlink:href', (d) => d.leafUid.href)
    leaf
      .append('text')
      .attr('clip-path', (d) => d.clipUid)
      .selectAll('tspan')
      .data((d) =>
        d.data.name.split(/(?=[A-Z][a-z])|\s+/g).concat(format(d.value))
      )
      .join('tspan')
      .attr('x', 3)
      .attr(
        'y',
        (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`
      )
      .attr('fill-opacity', (d, i, nodes) =>
        i === nodes.length - 1 ? 0.7 : null
      )
      .text((d) => d)

    return svg.node()
  }

  _renderBtn() {
    const btn = d3
      .create('button')
      .text('+')
      .style('position', 'absolute')
      .style('right', '2px')
      .style('top', '2px')
      .node()
    btn.addEventListener('click', console.log)

    return btn
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
      .style('user-select', 'none')
      .node()

    this.el.appendChild(this._renderSVG())
    this.el.append(this._renderBtn())
  }

  _init() {
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
}
