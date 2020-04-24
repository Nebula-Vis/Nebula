import Vue from 'vue/dist/vue.js'
import * as d3 from 'd3'
import _ from 'lodash'

export default Vue.extend({
  name: 'BarChart',
  template: `
<div class="Barchart-root">
  <svg width="100%" height="100%" ref="svg">
    <g>
      <template v-for="(value, index) in data">
        <rect :key="'rect' + index" />
      </template>
    </g>

    <g ref="brushG" @click="handleClick" />

    <template>
      <g ref="xAxis" />
      <g ref="yAxis" />
    </template>
    <!-- <line v-show="!isDisplayAxis" ref="line"></line> -->
  </svg>
</div>
  `,
  data() {
    return {
      id: '',
      data: [],
      selection: [],
      x: '',
      y: '',
      color: '#4e79a7',
      selectionColor: '#3fca2f',
      margin: {
        top: 20,
        right: 20,
        bottom: 35,
        left: 30,
      },
      isMounted: false,
      disableClick: false,
    }
  },
  computed: {
    scaleX() {
      // scale of xAxis
      const margin = this.margin
      const width = this.width
      const data = this.data

      const left = margin.left
      const right = width - margin.right

      return d3
        .scaleBand()
        .domain(d3.range(data.length))
        .rangeRound([left, right])
    },
    width() {
      if (!this.isMounted) {
        return
      }

      return this.$refs.svg.getBoundingClientRect().width
    },
    height() {
      if (!this.isMounted) {
        return
      }

      return this.$refs.svg.getBoundingClientRect().height
    },
    scaleY() {
      // scale of yAxis
      const data = this.data
      const margin = this.margin
      const height = this.height
      const y = this.y

      return d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d[y])])
        .nice()
        .range([height - margin.bottom, margin.top])
    },
    getSvg() {
      // get svg element
      const svg = this.$refs.svg
      return svg
    },
    getRect() {
      const svg = this.$refs.svg
      return d3.select(svg).selectAll('rect')
    },
    brushListener() {
      const width = this.width
      const height = this.height
      const margin = this.margin
      const brushing = this.brushing
      const brushended = this.brushended

      const left = margin.left
      const top = margin.top
      const right = width - margin.right
      const bottom = height - margin.bottom

      return d3
        .brushX()
        .extent([
          [left, top],
          [right, bottom],
        ])
        .on('brush', brushing)
        .on('end', brushended)
    },
  },
  watch: {
    selection: function () {
      // highlight the selected rect
      this.colorRect()
    },
    data: function () {
      const brush = this.brushListener
      this.drawRect()
      this.drawAxis()
      this.selection = []
      const brushG = this.$refs.brushG
      d3.select(brushG).transition().call(brush.clear)
    },
    // encoding: {
    //   handler: function () {
    //     this.drawRect()
    //     this.drawAxis()
    //     const brush = this.brushListener
    //     const brushG = this.$refs.brushG
    //     d3.select(brushG).call(brush.clear)
    //   },
    //   deep: true,
    // },
  },
  mounted() {
    this.isMounted = true
    this.drawRect()
    this.drawAxis()
    const brushG = this.$refs.brushG
    const brushListener = this.brushListener
    d3.select(brushG).call(brushListener)
  },
  methods: {
    brushing() {
      // brush event handler
      const x = this.scaleX
      const selection = d3.event.selection

      if (!(d3.event.sourceEvent instanceof MouseEvent)) return

      const data = this.data
      const minRange = x(0)
      const band = x.bandwidth()

      const x0 = Math.floor((selection[0] - minRange) / band)
      const x1 = Math.ceil((selection[1] - minRange) / band)

      const selected = this.selection

      // data change and emit event
      if (selected.length === 0) {
        this.selection = data.slice(x0, x1)
        this.$emit('selectionUpdate', this.selection)
      } else if (selected[0] !== x0 || selected[1] !== x1) {
        this.selection = data.slice(x0, x1)
        this.$emit('selectionUpdate', this.selection)
      }
    },
    brushended() {
      // brush event handler
      const x = this.scaleX
      const selection = d3.event.selection
      const brush = this.brushListener
      if (!(d3.event.sourceEvent instanceof MouseEvent)) return

      if (!selection) {
        this.selection = []
        this.disableClick = false
        this.$emit('selectionUpdate', null)
        return
      }
      this.disableClick = true
      const data = this.data
      const minRange = x(0)
      const band = x.bandwidth()

      const x0 = Math.floor((selection[0] - minRange) / band)
      const x1 = Math.ceil((selection[1] - minRange) / band)
      const res = [x(x0), x(x0) + (x1 - x0) * band]
      const selected = data.slice(x0, x1)
      this.selection = selected
      this.$emit('selectionUpdate', this.selection)
      const brushG = this.$refs.brushG
      d3.select(brushG).transition().call(brush.move, res)
    },
    drawRect() {
      // draw all rects
      const data = this.data
      const x = this.scaleX
      const y = this.scaleY
      const color = this.color
      const rect = this.getRect
      const yAttr = this.y
      rect
        .data(data)
        .attr('x', (d, i) => x(i))
        .attr('y', (d) => y(d[yAttr]))
        .attr('width', x.bandwidth())
        .attr('height', function (d) {
          return y(0) - y(d[yAttr])
        })
        .attr('fill', color)
    },
    drawAxis() {
      const xAxis = this.$refs.xAxis
      xAxis.innerHTML = ''
      const yAxis = this.$refs.yAxis
      yAxis.innerHTML = ''

      const x = this.scaleX
      const y = this.scaleY
      const width = this.width
      const height = this.height
      const margin = this.margin
      const data = this.data
      const xDisplay = 'x'
      const yDisplay = this.y

      const xAxisd3 = d3.axisBottom(x).ticks(data.length)

      d3.select(xAxis)
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(xAxisd3)
        .call((g) =>
          g
            .append('text')
            .attr('x', width)
            .attr('y', 30)
            .attr('fill', '#000')
            .attr('font-weight', 'bold')
            .attr('text-anchor', 'end')
            .text(xDisplay)
        )

      // console.log(yAxis)
      d3.select(yAxis)
        .attr('transform', `translate(${margin.left},0)`)
        .call(d3.axisLeft(y))
        .call((g) =>
          g
            .append('text')
            .attr('x', 0)
            .attr('y', 10)
            .attr('fill', '#000')
            .attr('font-weight', 'bold')
            .attr('text-anchor', 'start')
            .text(yDisplay)
        )
    },
    colorRect() {
      // change the color of the selected rects
      const color = this.color
      const selectionColor = this.selectionColor
      const rect = this.getRect
      const selected = this.selection.slice(0)

      rect.attr('fill', (d) => (selected.includes(d) ? selectionColor : color))
    },
    handleClick(event) {
      if (this.disableClick) return

      const clickX = event.layerX

      const x = this.scaleX
      const minRange = x.range()[0]
      const band = x.bandwidth()

      const binIndex = Math.floor((clickX - minRange) / band)
      if (binIndex >= this.data.length) {
        this.selection = []
        this.clickedBin = undefined
        return
      }

      const data = this.data
      this.selection = [data[binIndex]]
      this.$emit('selectionUpdate', this.selection)
    },
  },
})
