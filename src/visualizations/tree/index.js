import * as d3 from 'd3'
import ReactiveProperty from '@/reactive-prop'
import { getFieldsOfType } from '@/utils'
export default class Tree {
  constructor(props) {
    this.id = props.id
    this.data = props.data.hierarchy
    this.nodeId = props.nodeId || Object.keys(props.data.nodes[0])[0] || 'id'
    this.el = null
    this.treeData = null
    this._init()
  }

  _renderSVG() {
    const { clientWidth: width, clientHeight: height } = this.el
    let root = d3.hierarchy(this.data.get())
    root.dx = 10
    root.dy = width / (root.height + 1)
    root = d3.tree().nodeSize([root.dx, root.dy])(root)

    let x0 = Infinity
    let x1 = -x0
    root.each((d) => {
      if (d.x > x1) x1 = d.x
      if (d.x < x0) x0 = d.x
    })

    const svg = d3
      .create('svg')
      .attr('viewBox', [0, 0, width, x1 - x0 + root.dx * 2])

    const g = svg
      .append('g')
      .attr('font-family', 'sans-serif')
      .attr('font-size', 10)
      .attr(
        'transform',
        `translate(${(root.data.name.length + 1) * 5},${root.dx - x0})`
      )

    const link = g
      .append('g')
      .attr('fill', 'none')
      .attr('stroke', '#555')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', 1.5)
      .selectAll('path')
      .data(root.links())
      .join('path')
      .attr(
        'd',
        d3
          .linkHorizontal()
          .x((d) => d.y)
          .y((d) => d.x)
      )

    const node = g
      .append('g')
      .attr('stroke-linejoin', 'round')
      .attr('stroke-width', 3)
      .selectAll('g')
      .data(root.descendants())
      .join('g')
      .attr('transform', (d) => `translate(${d.y},${d.x})`)

    node
      .append('circle')
      .attr('fill', (d) => (d.children ? '#555' : '#999'))
      .attr('r', 2.5)

    node
      .append('text')
      .attr('dy', '0.31em')
      .attr('x', (d) => (d.children ? -6 : 6))
      .attr('text-anchor', (d) => (d.children ? 'end' : 'start'))
      .text((d) => d.data.name)
      .clone(true)
      .lower()
      .attr('stroke', 'white')
    // this.el.addEventListener('resize', (e) => {
    //   console.log('resizeEvent', e.target.clientHeight, e.target.clientWidth)
    // })
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
    if (typeof el === 'string' && !el.startsWith('#')) {
      el = `#${el}`
    }
    this.el = d3
      .select(el)
      .append('div')
      .style('position', 'relative')
      .style('box-sizing', 'border-box')
      .style('width', '100%')
      .style('height', '100%')
      .style('user-select', 'none')
      .style('overflow', 'auto')
      .node()

    this.el.appendChild(this._renderSVG())
  }
}

const b = {
  name: 'flare',
  children: [
    {
      name: 'analytics',
      children: [
        {
          name: 'cluster',
          children: [
            { name: 'AgglomerativeCluster', value: 3938 },
            { name: 'CommunityStructure', value: 3812 },
            { name: 'HierarchicalCluster', value: 6714 },
            { name: 'MergeEdge', value: 743 },
          ],
        },
        {
          name: 'graph',
          children: [
            { name: 'BetweennessCentrality', value: 3534 },
            { name: 'LinkDistance', value: 5731 },
            { name: 'MaxFlowMinCut', value: 7840 },
            { name: 'ShortestPaths', value: 5914 },
            { name: 'SpanningTree', value: 3416 },
          ],
        },
        {
          name: 'optimization',
          children: [{ name: 'AspectRatioBanker', value: 7074 }],
        },
      ],
    },
    {
      name: 'animate',
      children: [
        { name: 'Easing', value: 17010 },
        { name: 'FunctionSequence', value: 5842 },
        {
          name: 'interpolate',
          children: [
            { name: 'ArrayInterpolator', value: 1983 },
            { name: 'ColorInterpolator', value: 2047 },
            { name: 'DateInterpolator', value: 1375 },
            { name: 'Interpolator', value: 8746 },
            { name: 'MatrixInterpolator', value: 2202 },
            { name: 'NumberInterpolator', value: 1382 },
            { name: 'ObjectInterpolator', value: 1629 },
            { name: 'PointInterpolator', value: 1675 },
            { name: 'RectangleInterpolator', value: 2042 },
          ],
        },
        { name: 'ISchedulable', value: 1041 },
        { name: 'Parallel', value: 5176 },
        { name: 'Pause', value: 449 },
        { name: 'Scheduler', value: 5593 },
        { name: 'Sequence', value: 5534 },
        { name: 'Transition', value: 9201 },
        { name: 'Transitioner', value: 19975 },
        { name: 'TransitionEvent', value: 1116 },
        { name: 'Tween', value: 6006 },
      ],
    },
    {
      name: '_data',
      children: [
        {
          name: 'converters',
          children: [
            { name: 'Converters', value: 721 },
            { name: 'DelimitedTextConverter', value: 4294 },
            { name: 'GraphMLConverter', value: 9800 },
            { name: 'IDataConverter', value: 1314 },
            { name: 'JSONConverter', value: 2220 },
          ],
        },
        { name: 'DataField', value: 1759 },
        { name: 'DataSchema', value: 2165 },
        { name: 'DataSet', value: 586 },
        { name: 'DataSource', value: 3331 },
        { name: 'DataTable', value: 772 },
        { name: 'DataUtil', value: 3322 },
      ],
    },
    {
      name: 'display',
      children: [
        { name: 'DirtySprite', value: 8833 },
        { name: 'LineSprite', value: 1732 },
        { name: 'RectSprite', value: 3623 },
        { name: 'TextSprite', value: 10066 },
      ],
    },
  ],
}
