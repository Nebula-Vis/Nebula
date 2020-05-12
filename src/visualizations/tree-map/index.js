import * as d3 from 'd3'
import ReactiveProperty from '@/reactive-prop'
import _ from 'lodash'
import './treemap.css'
export default class TreeMap {
  constructor(props) {
    this.id = props.id
    this.data = props.data.hierarchy
    this.nodeId = props.nodeId || Object.keys(props.data.nodes[0])[0] || 'id'
    this.selection = props.selection
    this.tile = (props.encoding && props.encoding.tile) || 'treemapBinary'
    this.el = null
    this._init()
  }

  _renderSVG() {
    const { clientWidth: width, clientHeight: height } = this.el
    const that = this
    const format = d3.format(',d')
    const color = d3.scaleOrdinal(d3.schemeSet2)
    const hierarchy = d3
      .hierarchy(this.data.get())
      .sum((d) => d.value)
      .sort((a, b) => b.value - a.value)

    const root = d3
      .treemap()
      .tile(d3[this.tile])
      .size([width, height])
      .padding(1)
      .round(true)(hierarchy)

    const svg = d3
      .create('svg')
      .attr('viewBox', [0, 0, width, height])
      .style('font', '10px sans-serif')
      .attr('class', 'treemap')

    const treemap = svg.append('g').attr('transform', 'translate(0,0)')
    const leaf = treemap
      .selectAll('g')
      .data(root.leaves())
      .join('g')
      .attr('class', (d) => {
        const selectedNbid = _.get(this.selection.get(), 'data._nbid_', '')
        return selectedNbid && d.data._nbid_.indexOf(selectedNbid) > -1
          ? 'leaf selected'
          : 'leaf'
      })
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

    leaf.append('clipPath').attr('id', (d) => `${d.data._nbid_}_clipPath`)
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

    const brushF = d3
      .brush()
      .extent([
        [0, 0],
        [width, height],
      ])
      .on('end', brush, 1000)
    const brushG = svg.append('g').attr('class', 'brush')
    const resize = (extent) => {
      brushG.transition().call(brushF.move, extent)
    }
    brushF(brushG)
    this._onSelectionChange = (select) => {
      if (!select) resize(null)
      else {
        root.descendants().forEach(
          (d) => (
            d.data._nbid_ === select.data._nbid_ &&
              resize([
                [d.x0, d.y0],
                [d.x1, d.y1],
              ]) &&
              console.log(d),
            d.data._nbid_.indexOf(select.data._nbid_) > -1
              ? 'leaf selected'
              : 'leaf'
          )
        )
      }
    }
    function brush(area) {
      if (d3.event.selection || area) {
        const [[m0, n0], [m1, n1]] = d3.event.selection
        if (Math.abs(m0 - m1) < 10 || Math.abs(n0 - n1) < 10) {
          return that.selection.set(null)
        }
        const coverings = root
          .leaves()
          .filter(
            ({ x0, x1, y0, y1 }) =>
              !(m0 >= x1 || m1 <= x0 || n1 <= y0 || n0 >= y1)
          )
        // 这些leaves的最近公共祖先
        const deepestAncestor = coverings.length
          ? coverings.reduce((p, e) => {
              if (!e) return p
              while (p !== e && p.depth > -1 && e.depth > -1) {
                if (p.depth > e.depth) p = p.parent
                else if (p.depth < e.depth) e = e.parent
                else {
                  e = e.parent
                  p = p.parent
                }
              }
              return p
            })
          : null
        if (deepestAncestor) {
          that.selection.set(deepestAncestor)
          // const { x0, y0, x1, y1 } = deepestAncestor
          // if ([m0, n0, m1, n1].join('') !== [x0, y0, x1, y1].join('')) {
          //   that.selection.set(deepestAncestor)
          // }
        }
      }
    }
    return svg.node()
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
      'subtree'
    )
  }

  _onDataChange() {
    this.el.removeChild(this.el.children[0])
    this.el.appendChild(this._renderSVG())
  }
  // _onSelectionChange()  in _renderSVG
}
