import * as d3 from 'd3'
import _ from 'lodash'
import { boolArrayContentSame } from '../../utils/index'
import Vue from 'vue/dist/vue.js'
export default Vue.extend({
  name: 'BarCahrt',
  data() {
    return {
      margin: {},
      isMounted: false,
      selection: [],
      selectedXRange: {},
      xRange: {},
      brushedBins: [],
      isDisplay: true,
      encoding: null,
      svgWidth: 400,
      svgHeight: 50,
      xValueRange: [],
      data: [],
      containerSize: [400, 100],
      yArr: null,
      scaleColor: (d) => d,
      scaleAggregate: (d) => d,
      scaleScaleY: (d) => d,
    }
  },
  computed: {
    rotation() {
      let transform = ''
      switch (this.fullEncoding.bottomEdge) {
        case 'left':
          transform = `rotate(90) translate(0, ${-this.svgHeight})`
          break
        case 'right':
          transform = `rotate(-90) translate(${-this.svgWidth}, 0)`
          break
        case 'top-mirror':
          transform = `scale(1, -1) translate(0, ${-this.svgHeight})`
          break
        case 'left-mirror':
          transform = `rotate(90)  scale(-1, 1) translate(${-this
            .svgWidth}, ${-this.svgHeight})`
          break
        case 'right-mirror':
          transform = 'rotate(-90) scale(-1, 1)'
          break
        case 'top':
          transform = `scale(-1, -1) translate(${-this.svgWidth}, ${-this
            .svgHeight})`
          break
        case 'bottom-mirror':
          transform = `scale(-1, 1) translate(${-this.svgWidth}, 0)`
          break
        default:
          break
      }
      return transform
    },
    processData() {
      let curData = []
      if (!Array.isArray(this.data)) {
        curData = this.data.data
      } else {
        curData = this.data
      }
      const tempArr = this.xRange[this.fullEncoding.x] || []
      const data =
        tempArr.length === 2
          ? curData.filter(
              (item) =>
                item[this.fullEncoding.x] >= tempArr[0] &&
                item[this.fullEncoding.x] <= tempArr[1]
            )
          : curData
      return data
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
      return d3.scaleLinear().domain(this.xValueRange).rangeRound([left, right])
    },
    bins() {
      // parse dataset
      const tempArr = this.xRange[this.fullEncoding.x] || []
      const data = this.processData
      const binCount = this.fullEncoding.count

      const attr = this.fullEncoding.x

      const res = []
      const max = tempArr[1] || d3.max(this.processData, (d) => d[attr])
      const min = tempArr[0] || d3.min(this.processData, (d) => d[attr])
      this.xValueRange = [min, max]

      if (this.xType === 'number') {
        const dif = (max - min) / binCount
        for (let i = 1; i <= binCount - 1; i++) {
          res.push(min + dif * i)
        }

        const result = d3
          .histogram()
          .value((d) => d[attr])
          .domain(this.xValueRange)
          .thresholds(res)(data)

        result.forEach((d, i) => {
          if (i === 0) d.x0 = tempArr[0] || d.x0
          else if (i === result.length - 1) d.x1 = tempArr[1] || d.x1
          d.name = `${d.x0}-${d.x1}`
        })
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
      return this.svgWidth
    },
    height() {
      // get svg height
      if (!this.isMounted) {
        return
      }
      return this.svgHeight
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
      const left = this.isDisplay ? margin.left : 0
      const top = margin.top
      const right = this.isDisplay ? width - margin.right : width
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
        const [aggregate, multi] = [
          this.fullEncoding.aggregate,
          this.fullEncoding.scaleY,
        ]
        if (this.fullEncoding.stacked) {
          let curSum = 0
          item.stackArr = this.fullEncoding.y.map((y, index) => {
            let tempSum = 0
            item.forEach((item1) => (tempSum += item1[y]))
            const [tempA, tempS] = [this.scaleAggregate(y), this.scaleScaleY(y)]
            tempSum *= tempS
            if (tempA === 'count') tempSum = num * tempS
            else if (tempA === 'average') tempSum = tempSum / (num || 1)
            curSum += tempSum
            return [tempSum, curSum]
          })
          num = curSum
        } else if (this.fullEncoding.aggregate === 'sum') {
          num = sum * multi
        } else if (this.fullEncoding.aggregate === 'average') {
          num = (sum / (num || 1)) * multi
        } else if (this.fullEncoding.aggregate === 'min') {
          num = (d3.min(item, (d) => d[this.fullEncoding.y]) || 0) * multi
        } else if (this.fullEncoding.aggregate === 'max') {
          num = (d3.max(item, (d) => d[this.fullEncoding.y]) || 0) * multi
        }
        item.num = num
      })
    },
    getAggregate(rowAggregate) {
      if (typeof rowAggregate === 'string') {
        const arr = rowAggregate.split('-')
        arr[1] = Number(arr[1]) || 1
        return arr
      } else if (
        Object.prototype.toString.call(rowAggregate) === '[object Array]'
      ) {
        const aggregate = []
        const multi = []
        rowAggregate.forEach((item) => {
          const tempArr = item.split('-')
          aggregate.push(tempArr[0])
          multi.push(Number(tempArr[1]) || 1)
        })
        return [aggregate, multi]
      }
    },
    brushended(brushArea) {
      // brush event handler
      const x = this.scaleX
      const selection = brushArea || d3.event.selection
      const brush = this.brushListener
      const brushG = this.$refs.brushG
      if (!brushArea && !(d3.event.sourceEvent instanceof MouseEvent)) return
      if (
        brushArea &&
        (brushArea[0] === undefined || brushArea[1] === undefined)
      ) {
        d3.select(brushG).call(brush.clear)
        return
      }
      if (!selection) {
        this.selection = null
        this.brushedBins = []
        return
      }

      const bins = this.bins
      const minRange = x(bins[0].name)
      const band = x.bandwidth()

      let x0 = Math.round((selection[0] - minRange) / band)
      let x1 = Math.round((selection[1] - minRange) / band)
      if (x0 < 0) x0 = 0
      else if (x0 > bins.length) x0 = bins.length
      if (x1 < 0) x1 = 0
      else if (x1 > bins.length) x1 = bins.length
      const res = [x(bins[x0].name), x(bins[x0].name) + (x1 - x0) * band]
      const selected = _.concat.apply(null, bins.slice(x0, x1 + 1))
      if (!brushArea) {
        this.$emit('selection', selected)
        this.$emit('selectedXRange', {
          [this.fullEncoding.x]: [
            bins[x0].x0,
            x1 === bins.length ? bins[x1 - 1].x1 : bins[x1].x0,
          ],
        })
      }
      this.brushedBins = bins.slice(x0, x1).map((d) => d.name)
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
      d3.select(this.$refs['rectG']).selectAll('rect').remove()
      d3.select(this.$refs['colorG']).selectAll('rect').remove()

      if (this.fullEncoding.stacked) {
        bins.forEach((item) => {
          item.stackArr.forEach((item1, index) => {
            d3.select(this.$refs['colorG'])
              .append('rect')
              .attr('x', x(item.name) - this.margin.between)
              .attr('y', y(item1[1]))
              .attr('width', x.bandwidth() - this.margin.between * 2)
              .attr('height', y(0) - y(item1[0]))
              // .attr('fill', d3.schemeSet2[index])
              .attr('fill', this.scaleColor(this.fullEncoding.y[index]))
          })
        })
      } else {
        bins.forEach((item) => {
          d3.select(this.$refs['rectG'])
            .append('rect')
            .attr('x', x(item.name) - this.margin.between)
            .attr('y', y(item.num))
            .attr('width', x.bandwidth() - this.margin.between * 2)
            .attr('height', y(0) - y(item.num))
            .attr('fill', color)
            .attr('id', item.name)
        })
      }
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
      const [x0, x1] = this.selectedXRange[this.fullEncoding.x] || []
      const brushArea = [this.scaleXRange(x0), this.scaleXRange(x1)]
      this.brushended(brushArea)
    },
    getBrushArea(x0, x1) {},
    colorRect() {
      const color = this.fullEncoding.color
      const selectionColor = this.fullEncoding.selectionColor
      const rect = this.getRect
      const selectedBins = this.brushedBins.slice(0)
      const targePar = d3.select(this.$refs['rectG']).selectAll('rect')
      targePar.attr('fill', (a, b, c) => {
        return selectedBins.includes(c[b].id) ? selectionColor : color
      })
    },
    reverseWidthAndHeight(from, num1, num2) {
      if (from.includes('left') || from.includes('right')) return num2
      return num1
    },
    initScale() {
      this.scaleColor = d3
        .scaleOrdinal()
        .domain(this.fullEncoding.y)
        .range(this.fullEncoding.color)
      this.scaleAggregate = d3
        .scaleOrdinal()
        .domain(this.fullEncoding.y)
        .range(this.fullEncoding.aggregate)
      this.scaleScaleY = d3
        .scaleOrdinal()
        .domain(this.fullEncoding.y)
        .range(this.fullEncoding.scaleY)
      this.ySet = new Set(this.fullEncoding.y)
    },
  },
  mounted() {
    this.initScale()
    if (this.fullEncoding.stacked) this.yArr = new Array(...this.fullEncoding.y)
    const rect = this.$refs['container'].getBoundingClientRect()
    const from = this.fullEncoding.bottomEdge
    this.svgWidth = this.reverseWidthAndHeight(from, rect.width, rect.height)
    this.svgHeight = this.reverseWidthAndHeight(from, rect.height, rect.width)
    this.containerSize = [rect.width, rect.height]
    if (typeof this.encoding.isDisplay != 'undefined') {
      this.isDisplay = this.encoding.isDisplay
    }

    this.isMounted = true

    this.drawRect()
    this.drawAxis()
    this.drawBrush()
  },
  watch: {
    selection() {
      this.colorRect()
    },
    selectedXRange() {
      this.drawBrush()
      this.colorRect()
    },
    processData: function () {
      this.drawRect()
      if (this.encoding.isDisplay) {
        this.isDisplay = this.encoding.isDisplay
      }
      if (this.isDisplay) {
        this.$nextTick(function () {
          this.drawAxis()
        })
      }
    },
    xRange() {
      this.drawBrush()
      this.colorRect()
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
        const tempArr = new Array(...this.encoding.y)
        if (
          this.fullEncoding.stacked &&
          !boolArrayContentSame(tempArr, this.yArr)
        ) {
          this.yArr = tempArr
        }
      },
      deep: true,
    },
    yArr() {
      this.initScale()
    },
  },
  template: `
<div style="position: relative; width: 100%; height: 100%;" ref="container">
  <div>
    <svg :width="containerSize[0]" :height="containerSize[1]" ref="svg">
      <g :transform="rotation">
        <g ref="rectG" id="rectG">
          <template v-for="(value, index) in bins">
            <rect :key="'rect' + index" />
          </template>
        </g>
        <g ref="colorG"></g>

        <g ref="brushG" />

        <template v-if="isDisplay">
          <g ref="xAxis" />
          <g ref="yAxis" />
        </template>
      </g>
      <!-- <line v-show="!isDisplayAxis" ref="line"></line> -->
    </svg>
  </div>
</div>
`,
})
