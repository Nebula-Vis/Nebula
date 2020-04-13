import Vue from 'vue/dist/vue.js'
import * as d3 from 'd3'

export default Vue.extend({
  name: 'AreaChart',
  template: `
<div
  style="position: relative; width: 100%; height: 100%;"
  @mouseenter="isMouseIn = true"
  @mouseleave="isMouseIn = false"
>
  <svg width="100%" height="100%">
    <defs>
      <clipPath :id="\`\${id}-clip\`">
        <rect
          :x="margin + 1"
          :y="margin"
          :width="width - margin * 2"
          :height="height - margin * 2"
        ></rect>
      </clipPath>
    </defs>
    <g class="axes-g" style="user-select:none" v-if="showAxis">
      <g fill="currentColor" font-size="14">
        <text
          text-anchor="end"
          :x="width - margin"
          :y="height - margin"
          dy="2.1em"
        >
          {{ x }}
        </text>
        <text
          :x="margin"
          :y="margin"
          dy="-0.5em"
        >
          {{ y }}
        </text>
      </g>
      <g
        class="x-axis"
        :transform="\`translate(0, \${height - margin})\`"
      />
      <g
        class="y-axis"
        :transform="\`translate(\${margin}, 0)\`"
      />
    </g>
    <g class="areas-g" :clip-path="\`url(#\${id}-clip)\`">
      <path v-for="(mark, i) in marks" :key="i" v-bind="mark" />
    </g>
    <g class="brush-g" />
    <g class="zoom-g" />
  </svg>
  <button
    v-show="isMouseIn"
    style="position:absolute; top:10; right:10"
    @click="isFiltering = true"
  >
    Filter
  </button>
</div>
  `,
  data() {
    return {
      id: '',
      data: [],
      x: '',
      y: '',
      scale: null,
      selection: null,

      // other options
      colors: d3.schemeSet2,
      showAxis: true,
      showBrush: false,

      // local state
      isMouseIn: false,
      isFiltering: false,
      svg: null,

      // 杂七杂八param
      width: 200,
      height: 200,
      axisMargin: 40,
      blankMargin: 10,
    }
  },
  computed: {
    margin() {
      return this.showAxis ? this.axisMargin : this.blankMargin
    },
    ranges() {
      const { margin, width, height } = this
      return {
        x: [margin, width - margin],
        y: [height - margin, margin],
      }
    },
    stackedData() {
      return this.getStackedData(this.data)
    },
    scales() {
      const stackedData = this.stackedData
      const maxY = d3.max(stackedData[stackedData.length - 1], (d) => d[1])
      const domains = {
        x: this.scale,
        y: [0, maxY],
      }

      const scales = {}
      ;['x', 'y'].forEach((attrName) => {
        scales[attrName] = d3
          .scaleLinear()
          .domain(domains[attrName])
          .range(this.ranges[attrName])
      })

      scales.color = d3.scaleOrdinal().range(this.colors)
      return scales
    },
    marks() {
      const { scales, data, x } = this
      const area = d3
        .area()
        .x((d, i) => scales.x(data[i][x]))
        .y0((d) => scales.y(d[0]))
        .y1((d) => scales.y(d[1]))
      const paths = this.stackedData.map((d, i) => ({
        d: area(d),
        fill: scales.color(i),
        opacity: 0.2,
      }))

      area.x((d, i) => scales.x(selectionData[i][x]))

      const selectionSet = new Set(this.selection)
      const selectionData = this.data.filter((d) => selectionSet.has(d._nbid_))
      const stackedSelectionData = this.getStackedData(selectionData)
      const selectedPaths = stackedSelectionData.map((d, i) => ({
        d: area(d),
        fill: scales.color(i),
        opacity: 1,
      }))

      return paths.concat(selectedPaths)
    },
  },
  watch: {
    data(val) {
      if (this.showAxis) {
        this.drawAxis()
      }
    },
    x() {
      if (this.showAxis) {
        this.drawAxis()
      }
    },
    y() {
      if (this.showAxis) {
        this.drawAxis()
      }
    },
    scale() {
      if (this.showAxis) {
        this.drawAxis()
      }
    },
  },
  mounted() {
    this.svg = d3.select(this.$el).select('svg')

    this.getWidthHeight()
    if (this.showAxis) {
      this.drawAxis()
    }
    window.addEventListener('resize', () => {
      this.getWidthHeight()
      if (this.showAxis) {
        this.drawAxis()
      }
    })

    this.addBrush()

    window.addEventListener('keydown', (evt) => {
      if (this.isMouseIn && evt.key === 'Shift') {
        this.addZoom()
      }
    })
    window.addEventListener('keyup', () => {
      this.removeZoom()
    })
  },
  methods: {
    getWidthHeight() {
      const rect = this.$el.getBoundingClientRect()
      this.width = rect.width
      this.height = rect.height
    },
    getStackedData(data) {
      return d3.stack().keys(this.y)(data)
    },
    addBrush() {
      const onBrushEnd = () => {
        if (!d3.event.selection) return

        const [x0, x1] = d3.event.selection
        const selection = []
        const { scales, x } = this
        this.data.forEach((d) => {
          const xVal = scales.x(d[x])
          if (xVal >= x0 && xVal <= x1) {
            selection.push(d._nbid_)
          }
        })
        if (this.isFiltering) {
          const selectionSet = new Set(selection)
          this.data = this.data.filter((d) => selectionSet.has(d._nbid_))
          this.$emit('data', this.data)
        } else {
          this.selection = selection
          this.$emit('selection', selection)
        }
        this.isFiltering = false

        if (!this.showBrush) {
          this.svg.select('.brush-g').call(brush.clear)
        }
      }

      const { x: xRange, y: yRange } = this.ranges
      const brush = d3
        .brushX()
        .extent([
          [xRange[0], yRange[1]],
          [xRange[1] + 1, yRange[0]],
        ])
        .on('end', onBrushEnd)

      this.svg
        .select('.brush-g')
        .call(brush)
        .select('.selection')
        .attr('stroke', null)
    },
    addZoom() {
      const xScale = this.scales.x.copy()
      const onZoom = () => {
        const scale = d3.event.transform.rescaleX(xScale).domain()
        this.scale = scale
        this.$emit('scale', scale)
      }

      const { x: xRange, y: yRange } = this.ranges
      this.svg
        .select('.zoom-g')
        .append('rect')
        .attr('x', xRange[0])
        .attr('y', yRange[1])
        .attr('width', xRange[1] - xRange[0])
        .attr('height', yRange[0] - yRange[1])
        .attr('fill', 'none')
        .attr('pointer-events', 'all')
        .style('cursor', 'grab')
        .call(d3.zoom().on('zoom', onZoom))
    },
    removeZoom() {
      this.svg.select('.zoom-g').selectAll('*').remove()
    },
    drawAxis() {
      // 绘制坐标轴
      const xAxis = d3.axisBottom().scale(this.scales.x)
      const yAxis = d3.axisLeft().scale(this.scales.y)
      this.svg.select('.x-axis').call(xAxis)
      this.svg.select('.y-axis').call(yAxis)
    },
  },
})
