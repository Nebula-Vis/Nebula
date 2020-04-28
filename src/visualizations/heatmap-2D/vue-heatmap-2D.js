import Vue from 'vue/dist/vue.js'
import * as d3 from 'd3'
import { forEach, inRange } from 'lodash'
import { boolArraySame } from '../../utils'

export default Vue.extend({
  name: 'Heatmap-2D',
  template: `
<div class="HeatChart-root">
  <svg width="100%" height="100%" ref="svg">
    <g width="100%" height="100%" ref="rects"></g>
    <g
      class="axis"
      ref="x-axis"
      :transform="
        'translate(0, ' + (svgHeight - mergedEncoding.xAxisSpace - mergedEncoding.margin) + ')'
      "
    />
    <g
      class="axis"
      ref="y-axis"
      :transform="
        'translate(' + (mergedEncoding.yAxisSpace + mergedEncoding.margin) + ', 0)'
      "
    />
    <g v-if="brushListener" ref="brush"></g>
  </svg>
</div>
  `,
  data() {
    return {
      id: '',
      data: [],
      selection: [],
      aggregate: 'count',
      encoding: {
        x: undefined,
        y: undefined,
        z: undefined,
        aggregate: 'count',
        countX: 10,
        countY: 10,
        color: 'green',
        bgColor: 'white',
        bottomEdge: 'bottom',
        axisSwitch: false,
        rectMargin: 3,
        xAxisSpace: 20,
        yAxisSpace: 30,
        margin: 10,
      },
      defaultEncoding: {
        x: undefined,
        y: undefined,
        z: undefined,
        aggregate: 'count',
        countX: 10,
        countY: 10,
        color: 'green',
        bgColor: 'white',
        bottomEdge: 'bottom',
        axisSwitch: false,
        rectMargin: 3,
        xAxisSpace: 20,
        yAxisSpace: 30,
        margin: 10,
      },
      svgWidth: 400,
      svgHeight: 400,
      selectedData: [],
      rects: null,
    }
  },
  computed: {
    processedData() {
      if (Object.prototype.toString.call(this.data) === '[object Object]')
        return this.data.data
      else return this.data
    },
    mergedEncoding() {
      // 合并的配置
      const result = {}
      forEach(this.defaultEncoding, (item, key) => {
        if (this.encoding[key]) result[key] = this.encoding[key]
        else result[key] = item
      })
      if ((!result.x || !result.y) && this.processedData.length >= 1) {
        for (const i in this.processedData[0]) {
          if (typeof this.processedData[0][i] === 'number') {
            if (!result.x) {
              result.x = i
            } else if (!result.y) {
              result.y = i
              break
            } else break
          }
        }
      }
      return result
    },
    parsedData() {
      // 解析数据
      // let dataArr = []
      const dataMap = new Map()
      let dataMapX = new Map()
      let dataMapY = new Map()
      // let interval = undefined,
      let intervalX = undefined
      let intervalY = undefined
      let min = 0
      let max = 0
      let countX = this.mergedEncoding.countX
      let countY = this.mergedEncoding.countY
      let typeFlag = -1 // 0: 表示有用数据是数字，1：表示有用数据是字符串; -1: 表示无效数据
      // let typeFlagX = -1 //0: 表示有用数据是数字，1：表示有用数据是字符串; -1: 表示无效数据
      // let typeFlagY = -1 //0: 表示有用数据是数字，1：表示有用数据是字符串; -1: 表示无效数据
      // if (this.processedData.length >= 1) {
      //   if (typeof this.processedData[0][this.mergedEncoding.x] === 'number') typeFlagX = 0
      //   else if (typeof this.processedData[0][this.mergedEncoding.x] === 'string') typeFlagX = 1
      //   if (typeof this.processedData[0][this.mergedEncoding.y] === 'number') typeFlagY = 0
      //   else if (typeof this.processedData[0][this.mergedEncoding.y] === 'string') typeFlagY = 1
      // }
      const xyArr = ['x', 'y'].map((xy) => {
        if (this.processedData.length >= 1) {
          if (
            typeof this.processedData[0][this.mergedEncoding[xy]] === 'number'
          )
            typeFlag = 0
          else if (
            typeof this.processedData[0][this.mergedEncoding[xy]] === 'string'
          )
            typeFlag = 1
        }
        if (typeFlag === 0) {
          let first = 0
          this.processedData.forEach((item) => {
            if (first++ === 0) min = max = item[this.mergedEncoding[xy]]
            if (item[this.mergedEncoding[xy]] > max)
              max = item[this.mergedEncoding[xy]]
            if (item[this.mergedEncoding[xy]] < min)
              min = item[this.mergedEncoding[xy]]
          })
          return { typeFlag: typeFlag, min: min, max: max }
        } else if (typeFlag === 1) {
          this.processedData.forEach((item) => {
            if (dataMap.has(item[this.mergedEncoding[xy]])) {
              dataMap.set(
                item[this.mergedEncoding[xy]],
                dataMap.get(item[this.mergedEncoding[xy]]) + 1
              )
            } else dataMap.set(item[this.mergedEncoding[xy]], 1)
          })
          return { typeFlag: typeFlag, dataMap: dataMap }
        } else return undefined
      })
      let resultArr = []
      if (xyArr[1].typeFlag === 0) {
        resultArr = new Array(Number(countY))
        intervalY = (xyArr[1].max - xyArr[1].min) / countY
        if (xyArr[0].typeFlag === 0) {
          intervalX = (xyArr[0].max - xyArr[0].min) / countX
          this.processedData.forEach((item) => {
            let xValue = Math.floor(
              (item[this.mergedEncoding.x] - xyArr[0].min) / intervalX
            )
            let yValue = Math.floor(
              (item[this.mergedEncoding.y] - xyArr[1].min) / intervalY
            )
            if (xValue >= countX) xValue = countX - 1
            if (yValue >= countY) yValue = countY - 1
            if (!resultArr[yValue]) {
              resultArr[yValue] = new Array(Number(countX))
            }
            if (!resultArr[yValue][xValue]) resultArr[yValue][xValue] = [item]
            else resultArr[yValue][xValue].push(item)
          })
        } else if (xyArr[0].typeFlag === 1) {
          dataMapX = Array.from(xyArr[0].dataMap.keys())
          countX = dataMapX.length
          this.processedData.forEach((item) => {
            const xValue = dataMapX.indexOf(item[this.mergedEncoding.x])
            if (xValue === -1) {
              // console.error('数据出错！')
              return
            }
            let yValue = Math.floor(
              (item[this.mergedEncoding.y] - xyArr[1].min) / intervalY
            )
            if (yValue >= countY) yValue = countY - 1
            if (!resultArr[yValue]) {
              resultArr[yValue] = new Array(Number(countX))
            }
            if (!resultArr[yValue][xValue]) resultArr[yValue][xValue] = [item]
            else resultArr[yValue][xValue].push(item)
          })
        }
      } else if (xyArr[1].typeFlag === 1) {
        dataMapY = Array.from(xyArr[1].dataMap.keys())
        countY = dataMapY.length
        resultArr = new Array(Number(countY))
        if (xyArr[0].typeFlag === 0) {
          intervalX = (xyArr[0].max - xyArr[0].min) / countX
          this.processedData.forEach((item) => {
            let xValue = Math.floor(
              (item[this.mergedEncoding.x] - xyArr[0].min) / intervalX
            )
            const yValue = dataMapY.indexOf(item[this.mergedEncoding.y])
            if (yValue === -1) {
              // console.error('数据出错！')
              return
            }
            if (xValue >= countX) xValue = countX - 1
            if (!resultArr[yValue]) {
              resultArr[yValue] = new Array(Number(countX))
            }
            if (!resultArr[yValue][xValue]) resultArr[yValue][xValue] = [item]
            else resultArr[yValue][xValue].push(item)
          })
        } else if (xyArr[0].typeFlag === 1) {
          dataMapX = Array.from(xyArr[0].dataMap.keys())
          this.processedData.forEach((item) => {
            const xValue = dataMapX.indexOf(item[this.mergedEncoding.x])
            const yValue = dataMapY.indexOf(item[this.mergedEncoding.y])
            if (xValue === -1 || yValue === -1) {
              // console.error('数据出错！')
              return
            }
            if (!resultArr[yValue]) {
              resultArr[yValue] = new Array(Number(countX))
            }
            if (!resultArr[yValue][xValue]) resultArr[yValue][xValue] = 1
            else resultArr[yValue][xValue]++
          })
        }
      }
      max = 0
      for (let y = 0; y < countY; y++) {
        for (let x = 0; x < countX; x++) {
          if (!resultArr[y]) resultArr[y] = []
          if (!resultArr[y][x]) resultArr[y][x] = []
          const z = this.mergedEncoding.z
          let num = resultArr[y][x].length
          if (z) {
            let sum = 0
            resultArr[y][x].forEach((item) => {
              sum += item[z] || 0
            })
            if (this.aggregate === 'average') {
              num = sum / (resultArr[y][x].length || 1)
            } else if (this.aggregate === 'sum') num = sum
          }
          if (max < num) max = num
          resultArr[y][x] = num
        }
      }

      return {
        resultArr: resultArr,
        dataMapX: dataMapX,
        dataMapY: dataMapY,
        max: max,
        countX: countX,
        countY: countY,
        xyArr: xyArr,
        intervalX: intervalX,
        intervalY: intervalY,
      }
    },
    chartScale() {
      // 根据配置计算出图的各项规模
      let chartWidth = this.svgWidth
      let chartHeight = this.svgHeight
      let xRange = [0, chartWidth]
      let yRange = [chartHeight, 0]
      if (this.mergedEncoding.axisSwitch) {
        chartWidth =
          this.svgWidth -
          this.mergedEncoding.margin * 2 -
          this.mergedEncoding.yAxisSpace
        chartHeight =
          this.svgHeight -
          this.mergedEncoding.margin * 2 -
          this.mergedEncoding.xAxisSpace
        xRange = [
          this.mergedEncoding.margin + this.mergedEncoding.yAxisSpace,
          this.svgWidth - this.mergedEncoding.margin,
        ]
        yRange = [
          this.svgHeight -
            this.mergedEncoding.xAxisSpace -
            this.mergedEncoding.margin,
          this.mergedEncoding.margin,
        ]
      }
      const rectWidth = chartWidth / this.parsedData.countX
      const rectHeight = chartHeight / this.parsedData.countY
      return {
        chartWidth: chartWidth,
        chartHeight: chartHeight,
        xRange: xRange,
        yRange: yRange,
        rectWidth: rectWidth,
        rectHeight: rectHeight,
      }
    },
    axisText() {
      let xText = []
      let yText = []
      const xPosition = []
      const yPosition = []
      if (this.parsedData.xyArr[0].typeFlag === 0) {
        let last = this.dealDecimal(this.parsedData.xyArr[0].min)
        let cur = 0.0
        let tempPosition =
          this.chartScale.xRange[0] + 0.5 * this.chartScale.rectWidth
        for (let x = 0; x < this.parsedData.countX; x++) {
          cur = this.dealDecimal(last + this.parsedData.intervalX)
          const tempStr = `${last}~${cur}`
          last = cur
          xText.push(tempStr)
          xPosition.push(tempPosition)
          tempPosition += this.chartScale.rectWidth
        }
      } else if (this.parsedData.xyArr[0].typeFlag === 1) {
        xText = this.parsedData.dataMapX
        let tempPosition =
          this.chartScale.xRange[0] + 0.5 * this.chartScale.rectWidth
        for (let x = 0; x < this.parsedData.countX; x++) {
          xPosition.push(tempPosition)
          tempPosition += this.chartScale.rectWidth
        }
      }
      if (this.parsedData.xyArr[1].typeFlag === 0) {
        let last = this.dealDecimal(this.parsedData.xyArr[1].min)
        let cur = 0
        let tempPosition =
          this.chartScale.yRange[1] + 0.5 * this.chartScale.rectHeight
        for (let y = 0; y < this.parsedData.countY; y++) {
          cur = this.dealDecimal(last + this.parsedData.intervalY)
          const tempStr = `${last}~${cur}`
          last = cur
          yText.push(tempStr)
          yPosition.push(tempPosition)
          tempPosition += this.chartScale.rectHeight
        }
      } else if (this.parsedData.xyArr[1].typeFlag === 1) {
        yText = this.parsedData.dataMapY
        let tempPosition =
          this.chartScale.yRange[1] + 0.5 * this.chartScale.rectHeight
        for (let y = 0; y < this.parsedData.countY; y++) {
          yPosition.push(tempPosition)
          tempPosition += this.chartScale.rectHeight
        }
      }
      return [xText, yText, xPosition, yPosition]
    },
    axisConfig() {
      // 坐标轴的配置
      const x = d3
        .scaleOrdinal()
        .domain(this.axisText[0])
        .range(this.axisText[2])
      const y = d3
        .scaleOrdinal()
        .domain(this.axisText[1])
        .range(this.axisText[3])
      const xAxis = d3
        .axisBottom(x)
        .ticks(this.axisText[0].length)
        .tickValues(null)
      const yAxis = d3
        .axisLeft(y)
        .ticks(this.axisText[1].length)
        .tickValues(null)

      return {
        x: x,
        y: y,
        xAxis: xAxis,
        yAxis: yAxis,
      }
    },
    rotation() {
      // 旋转的角度
      let angle = 0
      switch (this.mergedEncoding.bottomEdge) {
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
      // return `rotate(${angle})`
      return `rotate(${angle}, ${this.svgWidth / 2}, ${this.svgHeight / 2})`
    },
    brushListener() {
      // 刷子的处理函数
      const self = this
      const chartScale = this.chartScale
      const brush = d3
        .brush()
        .extent([
          [chartScale.xRange[0], chartScale.yRange[1]],
          [chartScale.xRange[1], chartScale.yRange[0]],
        ])
        .on('end', brushended)
        .on('brush', function () {
          const selectXY = d3.brushSelection(this)
          if (!selectXY) return undefined
          let [[x0, y0], [x1, y1]] = selectXY
          const indices = []

          const tempX0 = Math.round(
            (x0 - self.chartScale.xRange[0]) / self.chartScale.rectWidth
          )
          const tempX1 = Math.round(
            (x1 - self.chartScale.xRange[0]) / self.chartScale.rectWidth
          )
          const tempY0 = Math.round(
            (y0 - self.chartScale.yRange[1]) / self.chartScale.rectHeight
          )
          const tempY1 = Math.round(
            (y1 - self.chartScale.yRange[1]) / self.chartScale.rectHeight
          )
          let i = 0
          let j = 0
          const targetArrX = []
          const targetArrY = []
          self.parsedData.dataMapX.forEach((value) => {
            if (i >= tempX0 && i < tempX1) targetArrX.push(value)
            i++
          })
          self.parsedData.dataMapY.forEach((value) => {
            if (j >= tempY0 && j < tempY1) targetArrY.push(value)
            j++
          })

          // let flagX = false,
          //   flagY = false
          if (self.parsedData.xyArr[0].typeFlag === 0) {
            const intervalX =
              (self.parsedData.xyArr[0].max - self.parsedData.xyArr[0].min) /
              self.parsedData.countX
            x0 = self.parsedData.xyArr[0].min + intervalX * tempX0
            x1 = self.parsedData.xyArr[0].min + intervalX * tempX1
            if (x0 === self.parsedData.xyArr[0].max) x0++
            if (x1 === self.parsedData.xyArr[0].max) x1++
            if (self.parsedData.xyArr[1].typeFlag === 0) {
              const intervalY =
                (self.parsedData.xyArr[1].max - self.parsedData.xyArr[1].min) /
                self.parsedData.countY
              y0 = self.parsedData.xyArr[1].min + intervalY * tempY0
              y1 = self.parsedData.xyArr[1].min + intervalY * tempY1
              if (y0 === self.parsedData.xyArr[1].max) y0++
              if (y1 === self.parsedData.xyArr[1].max) y1++
              self.processedData.forEach((item) => {
                if (
                  inRange(item[self.mergedEncoding.x], x0, x1) &&
                  inRange(item[self.mergedEncoding.y], y0, y1)
                )
                  indices.push(item)
              })
            } else if (self.parsedData.xyArr[1].typeFlag === 1) {
              self.processedData.forEach((item) => {
                if (
                  inRange(item[self.mergedEncoding.x], x0, x1) &&
                  targetArrY.includes(item[self.mergedEncoding.y])
                )
                  indices.push(item)
              })
            }
          } else if (self.parsedData.xyArr[0].typeFlag === 1) {
            if (self.parsedData.xyArr[1].typeFlag === 0) {
              const intervalY =
                (self.parsedData.xyArr[1].max - self.parsedData.xyArr[1].min) /
                self.parsedData.countY
              y0 = self.parsedData.xyArr[1].min + intervalY * tempY0
              y1 = self.parsedData.xyArr[1].min + intervalY * tempY1
              if (y0 === self.parsedData.xyArr[1].max) y0++
              if (y1 === self.parsedData.xyArr[1].max) y1++
              self.processedData.forEach((item) => {
                if (
                  targetArrX.includes(item[self.mergedEncoding.x]) &&
                  inRange(item[self.mergedEncoding.y], y0, y1)
                )
                  indices.push(item)
              })
            } else if (self.parsedData.xyArr[1].typeFlag === 1) {
              self.processedData.forEach((item) => {
                if (
                  targetArrX.includes(item[self.mergedEncoding.x]) &&
                  targetArrY.includes(item[self.mergedEncoding.y])
                )
                  indices.push(item)
              })
            }
          }

          // 当选中数据的数组变化时，才重新输出
          if (!boolArraySame(self.selectedData, indices)) {
            self.$emit('selection', indices)
            self.selectedData = indices
          }
        })

      function brushended() {
        const selection = d3.event.selection
        if (!d3.event.sourceEvent || !selection) return
        const [[x0, y0], [x1, y1]] = selection.map((d) => {
          const tempx = Math.round(
            (d[0] - self.chartScale.xRange[0]) / self.chartScale.rectWidth
          )
          const tempy = Math.round(
            (d[1] - self.chartScale.yRange[1]) / self.chartScale.rectHeight
          )
          return [
            self.chartScale.rectWidth * tempx + self.chartScale.xRange[0],
            self.chartScale.rectHeight * tempy + self.chartScale.yRange[1],
          ]
        })
        d3.select(this)
          .transition()
          .call(
            brush.move,
            x1 > x0
              ? [
                  [x0, y0],
                  [x1, y1],
                ]
              : null
          )
      }
      return brush
    },
  },
  watch: {
    data: function () {
      this.redrawChart()
    },
    mergedEncoding: function () {
      this.redrawChart()
    },
    parsedData: {
      handler: function () {
        this.redrawChart()
      },
      deep: true,
    },
  },
  mounted() {
    const rect = this.$refs['svg'].getBoundingClientRect()
    this.svgWidth = rect.width
    this.svgHeight = rect.height

    this.rects = d3.select(this.$refs['rects'])
    d3.select(this.$refs['svg']).attr(
      'style',
      `background-color: ${this.mergedEncoding.bgColor}`
    )
    this.drawRects()
  },
  methods: {
    redrawChart() {
      d3.select(this.$refs['svg']).attr(
        'style',
        `background-color: ${this.mergedEncoding.bgColor}`
      )
      d3.select(this.$refs['x-axis']).selectAll('path').remove()
      d3.select(this.$refs['x-axis']).selectAll('g').remove()
      d3.select(this.$refs['y-axis']).selectAll('path').remove()
      d3.select(this.$refs['y-axis']).selectAll('g').remove()
      this.rects.selectAll('rect').remove()
      this.drawRects()
    },
    drawRects() {
      // 不带有坐标轴的绘制函数
      if (this.mergedEncoding.axisSwitch) {
        d3.select(this.$refs['x-axis']).call(this.axisConfig.xAxis)
        d3.select(this.$refs['y-axis']).call(this.axisConfig.yAxis)
        d3.selectAll('.axis text').style('user-select', 'none')
        d3.selectAll('.axis path').style('display', 'none')
        d3.selectAll('.axis line').style('display', 'none')
      }
      let y = 0
      this.parsedData.resultArr.forEach((item) => {
        let x = 0
        item.forEach((item1) => {
          this.rects
            .append('rect')
            .attr(
              'height',
              `${
                this.chartScale.rectHeight - this.mergedEncoding.rectMargin * 2
              }`
            )
            .attr(
              'width',
              `${
                this.chartScale.rectWidth - this.mergedEncoding.rectMargin * 2
              }`
            )
            .attr(
              'transform',
              `translate(${x + this.mergedEncoding.rectMargin}, ${
                y + this.mergedEncoding.rectMargin
              })`
            )
            .attr(
              'style',
              `fill:${this.mergedEncoding.color};fill-opacity:${
                item1 / this.parsedData.max
              };`
            )
          x += this.chartScale.rectWidth
        })
        y += this.chartScale.rectHeight
      })
      if (this.mergedEncoding.axisSwitch)
        this.rects.attr(
          'transform',
          `${this.rotation} translate(${this.chartScale.xRange[0]}, ${this.chartScale.yRange[1]})`
        )
      else this.rects.attr('transform', `translate(0, 0)`)
      if (this.brushListener) {
        d3.select(this.$refs['brush']).call(this.brushListener)
      }
      this.drawBrush()
    },
    drawBrush() {
      const brushArea = this.computeSelectionArea()
      if (brushArea)
        d3.select(this.$refs['brush']).call(this.brushListener.move, brushArea)
    },
    computeSelectionArea() {
      let min = Number.MAX_SAFE_INTEGER
      let max = 0
      const resultArr = [[], []]
      if (this.selection.length >= 1) {
        if (this.parsedData.xyArr[0].typeFlag === 0) {
          min = max = this.selection[0][this.mergedEncoding.x]
          this.selection.forEach((item) => {
            if (item[this.mergedEncoding.x] > max)
              max = item[this.mergedEncoding.x]
            if (item[this.mergedEncoding.x] < min)
              min = item[this.mergedEncoding.x]
          })
          min =
            Math.floor(
              (min - this.parsedData.xyArr[0].min) / this.parsedData.intervalX
            ) *
              this.chartScale.rectWidth +
            this.chartScale.xRange[0]
          max =
            Math.ceil(
              (max - this.parsedData.xyArr[0].min) / this.parsedData.intervalX
            ) *
              this.chartScale.rectWidth +
            this.chartScale.xRange[0]
        } else if (this.parsedData.xyArr[0].typeFlag === 1) {
          const keyArr = this.parsedData.dataMapX
          min = max = keyArr.indexOf(this.selection[0][this.mergedEncoding.x])
          this.selection.forEach((item) => {
            if (keyArr.indexOf(item[this.mergedEncoding.x]) > max)
              max = keyArr.indexOf(item[this.mergedEncoding.x])
            if (keyArr.indexOf(item[this.mergedEncoding.x]) < min)
              min = keyArr.indexOf(item[this.mergedEncoding.x])
          })
          min = min * this.chartScale.rectWidth + this.chartScale.xRange[0]
          max =
            (max + 1) * this.chartScale.rectWidth + this.chartScale.xRange[0]
        }
        resultArr[0].push(min)
        resultArr[1].push(max)
        if (this.parsedData.xyArr[1].typeFlag === 0) {
          min = max = this.selection[0][this.mergedEncoding.y]
          this.selection.forEach((item) => {
            if (item[this.mergedEncoding.y] > max)
              max = item[this.mergedEncoding.y]
            if (item[this.mergedEncoding.y] < min)
              min = item[this.mergedEncoding.y]
          })
          min =
            this.chartScale.yRange[0] -
            Math.floor(
              (min - this.parsedData.xyArr[1].min) / this.parsedData.intervalY
            ) *
              this.chartScale.rectHeight
          max =
            this.chartScale.yRange[0] -
            Math.ceil(
              (max - this.parsedData.xyArr[1].min) / this.parsedData.intervalY
            ) *
              this.chartScale.rectHeight
        } else if (this.parsedData.xyArr[1].typeFlag === 1) {
          const keyArr = this.parsedData.dataMapY
          min = max = keyArr.indexOf(this.selection[0][this.mergedEncoding.y])
          this.selection.forEach((item) => {
            if (keyArr.indexOf(item[this.mergedEncoding.y]) > max)
              max = keyArr.indexOf(item[this.mergedEncoding.y])
            if (keyArr.indexOf(item[this.mergedEncoding.y]) < min)
              min = keyArr.indexOf(item[this.mergedEncoding.y])
          })
          min = this.chartScale.yRange[0] - min * this.chartScale.rectHeight
          max =
            this.chartScale.yRange[0] - (max + 1) * this.chartScale.rectHeight
        }
        resultArr[1].push(min)
        resultArr[0].push(max)
        return resultArr
      }
      return undefined
    },
    dealDecimal(num) {
      return Math.floor(num * 100) / 100
    },
  },
})
