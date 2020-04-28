import * as d3 from 'd3'
import _ from 'lodash'
import Vue from 'vue/dist/vue.js'
export default Vue.extend({
  name: 'BarCahrt',
  data() {
    return {
      margin: {
        top: 20,
        right: 20,
        bottom: 35,
        left: 30,
      },
      isMounted: false,
      selection: [],
      selectedXRange: [],
      brushedBins: [],
      clickedBin: undefined,
      disableClick: false,
      isDisplay: true,
      encoding: null,
      svgWidth: 400,
      svgHeight: 50,
      xRange: [],
    }
  },
  computed: {
    rotation() {
      let angle = 0
      switch (this.fullEncoding.bottomEdge) {
        case 'right':
          angle = -90
          break
        case 'left':
          angle = 90
          break
        case 'top':
          angle = 180
          break
        default:
          break
      }
      return `rotate(${angle})`
    },
    edgePoints() {
      if (!Array.isArray(this.data)) {
        return this.data.edgePoints
      } else {
        return undefined
      }
    },
    processData() {
      if (!Array.isArray(this.data)) {
        return this.data.data
      } else {
        return this.data
      }
    },
    fullEncoding() {
      const defaultEncoding = {
        x: 'Name of the horizontal axis', // TODO
        aggregate: 'count',
        stacked: false,
        count: 5,
        color: '#4e79a7',
        selectionColor: '#3fca2f',
      }
      return _.merge(defaultEncoding, this.encoding)
    },
    xType() {
      if (
        this.data.length > 0 &&
        typeof this.data[0][this.fullEncoding.x] === 'string'
      )
        return 'string'
      else return 'number'
    },
    scaleX() {
      // scale of xAxis
      let left = this.margin.left
      let right = this.width - this.margin.right

      if (!this.isDisplay) {
        left = 0
        right = this.width
      }

      return d3
        .scaleBand()
        .domain(this.bins.map((d) => d.name))
        .rangeRound([left, right])
    },
    scaleXRange() {
      // scale of xAxis
      let left = this.margin.left
      let right = this.width - this.margin.right
      if (!this.isDisplay) {
        left = 0
        right = this.width
      }
      return d3.scaleLinear().domain(this.xRange).rangeRound([left, right])
    },
    bins() {
      // parse dataset
      const data = this.processData
      const binCount = this.fullEncoding.count

      const attr = this.fullEncoding.x

      const res = []
      const max = d3.max(this.processData, (d) => d[attr])
      const min = d3.min(this.processData, (d) => d[attr])
      this.xRange = [min, max]

      if (this.xType === 'number') {
        const dif = (max - min) / binCount
        for (let i = 1; i <= binCount - 1; i++) {
          res.push(min + dif * i)
        }

        const result = d3
          .histogram()
          .value((d) => d[attr])
          .thresholds(res)(data)

        result.forEach((d) => (d.name = `${d.x0}-${d.x1}`))
        this.binForAggregate(result)
        return result
      } else {
        const set = new Set(data.map((d) => d[attr]))
        const values = Array.from(set)
        values.sort()

        const valueMap = {}
        values.forEach((d, i) => (valueMap[d] = i))

        const result = values.map(() => [])
        result.forEach((d, i) => (d.name = values[i]))

        data.forEach((d) => result[valueMap[d[attr]]].push(d))
        this.binForAggregate(result)
        return result
      }
    },
    width() {
      // get svg width
      if (!this.isMounted) {
        return
      }
      return this.$refs.svg.getBoundingClientRect().width
    },
    height() {
      // get svg height
      if (!this.isMounted) {
        return
      }
      return this.$refs.svg.getBoundingClientRect().height
    },
    scaleY() {
      // scale of yAxis
      const bins = this.bins
      const margin = this.margin
      const height = this.height
      return d3
        .scaleLinear()
        .domain([0, d3.max(bins, (d) => d.num)])
        .nice()
        .range([height - margin.bottom, margin.top])
    },
    getSvg() {
      // get svg element
      const svg = this.$refs.svg
      return svg
    },
    getRect() {
      // get all rects
      const svg = this.$refs.svg
      return d3.select(svg).selectAll('rect')
    },
    brushListener() {
      // listener of brush event
      const width = this.width
      const height = this.height
      const margin = this.margin
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
        .on('end', brushended)
    },
  },
  methods: {
    binForAggregate(bins) {
      bins.forEach((item) => {
        let sum = 0
        let num = item.length
        item.forEach((item) => (sum += item[this.fullEncoding.y]))
        if (this.fullEncoding.stacked) {
          let curSum = 0
          item.stackArr = this.fullEncoding.y.map((y, index) => {
            let tempSum = 0
            item.forEach((item1) => (tempSum += item1[y]))
            if (this.fullEncoding.aggregate[index] === 'count') tempSum = num
            else if (this.fullEncoding.aggregate[index] === 'average')
              tempSum = tempSum / (num || 1)
            curSum += tempSum
            return [tempSum, curSum]
          })
          num = curSum
        } else if (this.fullEncoding.aggregate === 'sum') {
          num = sum
        } else if (this.fullEncoding.aggregate === 'average') {
          num = sum / (num || 1)
        }
        item.num = num
      })
    },
    brushended(brushArea) {
      // brush event handler
      const x = this.scaleX
      const selection = brushArea || d3.event.selection
      const brush = this.brushListener
      if (!brushArea && !(d3.event.sourceEvent instanceof MouseEvent)) return

      if (!selection) {
        this.selection = null
        this.brushedBins = []
        this.disableClick = false
        return
      }
      this.clickedBin = undefined
      this.disableClick = true

      const bins = this.bins
      const minRange = x(bins[0].name)
      const band = x.bandwidth()

      const x0 = Math.round((selection[0] - minRange) / band)
      const x1 = Math.round((selection[1] - minRange) / band)
      const res = [x(bins[x0].name), x(bins[x0].name) + (x1 - x0) * band]
      const selected = _.concat.apply(null, bins.slice(x0, x1))
      // this.selection = selected
      this.$emit('selection', selected)
      this.$emit('selectedXRange', [x0, x1])
      this.brushedBins = bins.slice(x0, x1).map((d) => d.name)
      const brushG = this.$refs.brushG
      d3.select(brushG).transition().call(brush.move, res)
    },
    drawRect() {
      // draw all rects
      const bins = this.bins
      const x = this.scaleX
      const y = this.scaleY
      const color = this.fullEncoding.color
      const rect = this.getRect
      const self = this

      if (this.fullEncoding.stacked) {
        const colorArr = this.fullEncoding.y.map(() =>
          `000000${Math.floor(Math.random() * 16777216).toString(16)}`.slice(-6)
        )
        rect
          .data(bins)
          .attr('x', (d) => x(d.name))
          .attr('y', (d) => y(d.num))
          .attr('width', x.bandwidth())
          .attr('height', (d) => y(0) - y(d.num))
          .attr('fill', color)
        bins.forEach((item) => {
          item.stackArr.forEach((item1, index) => {
            d3.select('#rectG')
              .append('rect')
              .attr('x', x(item.name))
              .attr('y', y(item1[1]))
              .attr('width', x.bandwidth())
              .attr('height', y(0) - y(item1[0]))
              .attr('fill', `#${colorArr[index]}`)
          })
        })
      } else
        rect
          .data(bins)
          .attr('x', (d) => x(d.name))
          .attr('y', (d) => y(d.num))
          .attr('width', x.bandwidth())
          .attr('height', (d) => y(0) - y(d.num))
          .attr('fill', color)
    },
    drawAxis() {
      // draw axis
      const xAxis = this.$refs.xAxis
      xAxis.innerHTML = ''
      const yAxis = this.$refs.yAxis
      yAxis.innerHTML = ''

      const x = this.scaleX
      const y = this.scaleY
      const width = this.width
      const height = this.height
      const margin = this.margin
      const bins = this.bins
      const xDisplay = this.fullEncoding.x
      const yDisplay = 'Count'
      const set = new Set()
      for (let i = 0; i < bins.length; i++) {
        set.add(bins[i].x0)
        set.add(bins[i].x1)
      }
      const values = Array.from(set)
      let xAxisd3 = null
      if (this.xType === 'number') {
        xAxisd3 = d3
          .axisBottom(
            d3
              .scaleLinear()
              .domain([bins[0].x0, bins[bins.length - 1].x1])
              .range(x.range())
          )
          .ticks(bins.length)
          .tickValues(values)
          .tickFormat((d) => `${d.toFixed(2)}`)
      } else {
        xAxisd3 = d3.axisBottom(x).ticks(bins.length)
      }

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
    drawBrush() {
      const brushG = this.$refs.brushG
      const brushListener = this.brushListener
      d3.select(brushG).call(brushListener)
      const brushArea = [
        this.scaleXRange(this.selectedXRange[0]),
        this.scaleXRange(this.selectedXRange[1]),
      ]
      this.brushended(brushArea)
      // d3.select(brushG).call(brushListener.move, brushArea)
    },
    getBrushArea(x0, x1) {},
    colorRect() {
      // change the color of the selected rects
      const color = this.fullEncoding.color
      const selectionColor = this.fullEncoding.selectionColor
      const rect = this.getRect
      const selectedBins = this.brushedBins.slice(0)
      if (this.clickedBin) selectedBins.push(this.clickedBin)

      rect.attr('fill', (d) =>
        selectedBins.includes(d.name) ? selectionColor : color
      )
    },
    handleClick(event) {
      if (this.disableClick) return

      const clickX = event.layerX

      const x = this.scaleX
      const minRange = x.range()[0]
      const band = x.bandwidth()

      const binIndex = Math.floor((clickX - minRange) / band)
      if (binIndex >= this.bins.length) {
        this.selection = []
        this.clickedBin = undefined
        return
      }

      const bins = this.bins
      this.selection = bins[binIndex]
      this.clickedBin = bins[binIndex].name
      this.brushedBins = []
    },
    getEdgePointsMaxAndMin() {
      const xmin = Math.min(...this.edgePoints.map((d) => d[0]))
      const xmax = Math.max(...this.edgePoints.map((d) => d[0]))
      const ymin = Math.min(...this.edgePoints.map((d) => d[1]))
      const ymax = Math.max(...this.edgePoints.map((d) => d[1]))
      return [
        [xmin, xmax],
        [ymin, ymax],
      ]
    },
    getXInterval() {
      const edgePointsMaxAndMin = this.getEdgePointsMaxAndMin()
      const xInterval = []
      const x = []
      const binCount = this.bins.length
      const rectWidth = this.$refs['rectG'].getBoundingClientRect().width
      const diff = Number.parseFloat(rectWidth / binCount).toFixed(2)

      for (let i = 0; i <= binCount; i++) {
        x.push(i * diff)
      }
      const xmin = edgePointsMaxAndMin[0][0]
      const xmax = edgePointsMaxAndMin[0][1]

      const x0 = x.findIndex(function (value) {
        return value > xmin
      })

      xInterval.push(x[x0 - 1])
      const x1 = x.findIndex(function (value) {
        return value > xmax
      })

      xInterval.push(x[x1])

      return xInterval
    },
  },
  mounted() {
    const rect = this.$refs['svg'].getBoundingClientRect()
    this.svgWidth = rect.width
    this.svgHeight = rect.height
    if (typeof this.encoding.isDisplay != 'undefined') {
      this.isDisplay = this.encoding.isDisplay
    }

    this.isMounted = true

    this.drawRect()
    this.drawAxis()
    this.drawBrush()
    if (this.edgePoints) {
      const xInterval = this.getXInterval()
      const container = this.$refs['container']

      const x0 = xInterval[0]
      const x1 = xInterval[1]
      const left = this.margin.left

      container.style.width = `${x1 - x0 + left}px`
      container.style.marginLeft = `${x0}px`
    }
  },
  watch: {
    // selection() {
    //   this.colorRect()
    //   this.$emit('selection', this.selection)
    //   console.log(this.selection)
    // },
    data: function () {
      if (this.edgePoints) {
        const xInterval = this.getXInterval()
        const container = this.$refs['container']

        const x0 = xInterval[0]
        const x1 = xInterval[1]
        const left = this.margin.left

        container.style.width = `${x1 - x0 + left}px`
        container.style.marginLeft = `${x0}px`
      }
      this.drawRect()
      if (this.encoding.isDisplay) {
        this.isDisplay = this.encoding.isDisplay
      }
      if (this.isDisplay) {
        this.$nextTick(function () {
          this.drawAxis()
          this.selection = []
          const brush = this.brushListener
          const brushG = this.$refs.brushG
          d3.select(brushG).transition().call(brush.clear)
        })
      }
    },
    encoding: {
      handler: function () {
        if (typeof this.encoding.isDisplay != 'undefined') {
          this.isDisplay = this.encoding.isDisplay
        } else {
          this.isDisplay = true
        }

        this.drawRect()

        if (this.isDisplay) {
          this.$nextTick(function () {
            this.drawAxis()
            const brush = this.brushListener
            const brushG = this.$refs.brushG
            d3.select(brushG).call(brush.clear)
          })
        }
      },
      deep: true,
    },
  },
  template: `
<div style="position: relative; width: 100%; height: 100%;">
  <div ref="container">
    <svg width="100%" height="100%" ref="svg" :transform="rotation">
      <g ref="rectG" id="rectG">
        <template v-for="(value, index) in bins">
          <rect :key="'rect' + index" />
        </template>
      </g>

      <g ref="brushG" @click="handleClick" />

      <template v-if="isDisplay">
        <g ref="xAxis" />
        <g ref="yAxis" />
      </template>
      <!-- <line v-show="!isDisplayAxis" ref="line"></line> -->
    </svg>
  </div>
</div>
`,
})
