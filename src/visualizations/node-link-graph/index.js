// code for render the force-directed graph is from
// https://observablehq.com/@d3/force-directed-graph
import * as d3 from 'd3'
import { clamp } from 'lodash'
import ReactiveProperty from '@/reactive-prop'

export default class NodeLinkGraph {
  constructor(props) {
    this.id = props.id
    if (props.data.nodes && props.data.links) {
      this.data = {
        nodes: props.data.nodes,
        links: props.data.links,
      }
    }
    this.nodeId = props.nodeId || 'id'
    this.selection = props.selection || this.data.nodes

    this.color = d3.schemeSet2[0]
    this.selectionColor = d3.schemeSet2[1]
    this.circleRadius = 5

    this._init()
  }

  mount(el) {
    if (typeof el === 'string' && !el.startsWith('#')) {
      el = `#${el}`
    }
    this.el = d3
      .select(el)
      .append('div')
      .style('position', 'relative')
      .style('width', '100%')
      .style('height', '100%')
      .node()

    this._renderGraph()
  }

  _init() {
    this.data = new ReactiveProperty(
      this,
      'data',
      this.data,
      '_onDataSet',
      'set',
      'data'
    )
    this.selection = new ReactiveProperty(
      this,
      'selection',
      this.selection,
      '_onSelectionSet',
      'select',
      'items'
    )
  }

  _onDataSet(val) {
    this._renderGraph()
    this.selection.set(val.nodes)
  }

  _onSelectionSet(val) {
    const color = this.color
    const selectionColor = this.selectionColor
    const selectionNbIds = new Set(val.map((d) => d._nbid_))
    const nodes = this.data.get().nodes
    d3.select(this.el)
      .selectAll('circle')
      .attr('fill', (d, i) =>
        selectionNbIds.has(nodes[i]._nbid_) ? selectionColor : color
      )
  }

  _renderGraph() {
    const data = this.data.get()
    const selection = new Set(this.selection.get().map((d) => d._nbid_))
    const color = this.color
    const selectionColor = this.selectionColor
    const radius = this.circleRadius
    const el = d3.select(this.el).node()
    const rect = el.getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    const links = data.links.map((d) => Object.create(d))
    const nodes = data.nodes.map((d) => Object.create(d))

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        'link',
        d3
          .forceLink(links)
          .id((d) => d[this.nodeId])
          .distance(Math.sqrt((width * height) / nodes.length))
      )
      .force(
        'charge',
        d3.forceManyBody().distanceMax(Math.min(width, height) / 2)
      )
      .force('center', d3.forceCenter(width / 2, height / 2))

    const svg = d3.create('svg').attr('viewBox', [0, 0, width, height])

    const link = svg
      .append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')

    const node = svg
      .append('g')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', radius)
      .attr('fill', (d) => (selection.has(d._nbid_) ? selectionColor : color))
      .call(this._drag(simulation))

    node.append('title').text((d) => d[this.nodeId])

    simulation.on('tick', () => {
      node
        .attr('cx', (d) => (d.x = clamp(d.x, radius, width - radius)))
        .attr('cy', (d) => (d.y = clamp(d.y, radius, height - radius)))

      link
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y)
    })

    if (el.firstChild) {
      el.removeChild(el.firstChild)
    }
    el.appendChild(svg.node())
  }

  _drag(simulation) {
    const dragstarted = (d) => {
      if (!d3.event.active) simulation.alphaTarget(0.3).restart()
      d.fx = d.x
      d.fy = d.y
    }

    const dragged = (d) => {
      d.fx = d3.event.x
      d.fy = d3.event.y
    }

    const dragended = (d) => {
      if (!d3.event.active) simulation.alphaTarget(0)
      d.fx = null
      d.fy = null
    }

    return d3
      .drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended)
  }
}
