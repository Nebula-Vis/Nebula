import Vue from 'vue/dist/vue.js'
import * as d3 from 'd3'

export default Vue.extend({
  name: 'Scatterplot',
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
          :x="margin"
          :y="margin"
          :width="width - margin * 2"
          :height="height - margin * 2"
        ></rect>
      </clipPath>
    </defs>
    <g class="brush-g" />
    <g class="points-g" :clip-path="\`url(#\${id}-clip)\`">
      <circle v-for="(mark, i) in marks" :key="i" v-bind="mark" :r="size" :fill-opacity="0.7" />
    </g>
    <g class="zoom-g" />
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
  </svg>
  <!-- <button
    v-show="isMouseIn"
    style="position:absolute; top:10; right:10"
    @click="isFiltering = true"
  >
    Filter
  </button> -->
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
      color: d3.schemeSet2[0],
      alternateColor: d3.schemeSet2[1],
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
      size: 4,
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
    scales() {
      const domains = {
        x: this.scale[this.x],
        y: this.scale[this.y],
      }
      const ranges = this.ranges

      const scales = {}
      ;['x', 'y'].forEach((attrName) => {
        scales[attrName] = d3
          .scaleLinear()
          .domain(domains[attrName])
          .range(ranges[attrName])
      })
      return scales
    },
    scaledData() {
      return this.data.map((d) => ({
        x: this.scales.x(d[this.x]),
        y: this.scales.y(d[this.y]),
      }))
    },
    marks() {
      const selectionSet = new Set(this.selection.map((d) => d._nbid_))
      const front = []
      const back = []
      this.scaledData.forEach((d, i) => {
        const isSelected = selectionSet.has(this.data[i]._nbid_)
        const mark = {
          cx: d.x,
          cy: d.y,
          fill: isSelected ? this.color : this.alternateColor,
          // opacity: isSelected ? 1 : 0.2,
        }
        ;(isSelected ? front : back).push(mark)
      })
      return back.concat(front)
    },
  },
  watch: {
    data() {
      if (this.showAxis && this.svg) {
        this.drawAxis()
      }
    },
    x() {
      if (this.showAxis && this.svg) {
        this.drawAxis()
      }
    },
    y() {
      if (this.showAxis && this.svg) {
        this.drawAxis()
      }
    },
    scale() {
      if (this.showAxis && this.svg) {
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
    addBrush() {
      const onBrushEnd = () => {
        if (!d3.event.selection) return

        const [[x0, y0], [x1, y1]] = d3.event.selection
        const selection = []
        this.scaledData.forEach((d, i) => {
          if (d.x >= x0 && d.x <= x1 && d.y >= y0 && d.y <= y1) {
            selection.push(this.data[i])
          }
        })
        if (this.isFiltering) {
          const selectionSet = new Set(selection.map((d) => d._nbid_))
          this.data = this.data.filter((d) => selectionSet.has(d._nbid_))
          this.$emit('data', this.data)
        } else {
          this.selection = selection
          this.$emit('selection', selection)
        }
        this.isFiltering = false

        // if (!this.showBrush) {
        //   this.svg.select('.brush-g').call(brush.clear)
        // }
      }

      const { x: xRange, y: yRange } = this.ranges
      const brush = d3
        .brush()
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
      const yScale = this.scales.y.copy()
      const onZoom = () => {
        const scale = {
          ...this.scale,
          [this.x]: d3.event.transform.rescaleX(xScale).domain(),
          [this.y]: d3.event.transform.rescaleY(yScale).domain(),
        }
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
      // const xAxis = d3.axisBottom().scale(this.scales.x).ticks(8)
      const yAxis = d3.axisLeft().scale(this.scales.y)
      this.svg.select('.x-axis').call(xAxis)
      this.svg.select('.y-axis').call(yAxis)
    },
  },
})
