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
          :x="margin - radius"
          :y="margin - radius"
          :width="width - margin * 2 + radius * 2"
          :height="height - margin * 2 + radius * 2"
        ></rect>
      </clipPath>
    </defs>
    <g>
      <g
        class="axis x-axis"
        :transform="\`translate(0, \${height - margin})\`"
      />
      <g
        class="axis y-axis"
        :transform="\`translate(\${margin}, 0)\`"
      />
    </g>
    <g class="brush-g" />
    <g :clip-path="\`url(#\${id}-clip)\`">
      <!-- <rect fill="black" x="-10" y="-10" width="500" height="500"></rect> -->
      <circle v-for="(mark, i) in marks" :key="i" v-bind="mark" :r="radius" />
    </g>
    <g class="zoom-g" />
  </svg>
</div>
  `,
  data() {
    return {
      id: '',
      data: [],
      selection: null,
      x: '',
      y: '',
      scale: null,

      // other options
      color: '#eee',
      selectionColor: '#3fca2f',
      axis: true,
      showBrush: false,

      // temp state
      isMouseIn: false,
      svg: null,

      // 杂七杂八param
      width: 200,
      height: 200,
      margin: 40,
      axisMargin: 40,
      blankMargin: 10,
      radius: 4,
    }
  },
  computed: {
    scales() {
      const domains = {
        x: this.scale[0],
        y: this.scale[1],
      }

      const { margin, width, height } = this
      const ranges = {
        x: [margin, width - margin],
        y: [height - margin, margin],
      }

      const scales = {}
      ;['x', 'y'].forEach(attrName => {
        scales[attrName] = d3
          .scaleLinear()
          .domain(domains[attrName])
          .range(ranges[attrName])
      })
      return scales
    },
    scaledData() {
      return this.data.map(d => ({
        x: this.scales.x(d[this.x]),
        y: this.scales.y(d[this.y]),
      }))
    },
    marks() {
      const selectionSet = new Set(this.selection)
      const front = []
      const back = []
      const data = this.data
      this.scaledData.forEach((d, i) => {
        const isSelected = selectionSet.has(data[i]._nbid_)
        const mark = {
          cx: d.x,
          cy: d.y,
          fill: isSelected ? this.selectionColor : this.color,
        }
        if (isSelected) {
          front.push(mark)
        } else {
          back.push(mark)
        }
      })
      return back.concat(front)
    },
  },
  watch: {
    data(val) {
      // TODO
      this.selection = this.getIdsFromData(val)
      this.scale = this.getAxisDomainsFromData(val)
      // this.checkXY()
      if (this.axis) {
        this.redrawAxis()
      }
    },
    x() {
      if (this.axis) {
        this.redrawAxis()
      }
    },
    y() {
      if (this.axis) {
        this.redrawAxis()
      }
    },
    scale() {
      if (this.axis) {
        this.redrawAxis()
      }
    },
  },
  created() {
    if (!this.x) {
      this.x = getIthFieldOfType(this.data, 0, 'number')
    } else if (!this.boolDataHasAttribute(this.data, this.x)) {
      throw `Attribute ${this.x} does not exist`
    }
    if (!this.y) {
      this.y = getIthFieldOfType(this.data, 1, 'number')
    } else if (!this.boolDataHasAttribute(this.data, this.y)) {
      throw `Attribute ${this.y} does not exist`
    }

    if (!isArrayOfType(this.scale, 'number', 2, 2)) {
      this.scale = this.getAxisDomainsFromData(this.data, this.x, this.y)
    }

    if (!this.selection || !this.selection.length) {
      this.selection = this.getIdsFromData(this.data)
    }

    this.margin = this.axis ? this.axisMargin : this.blankMargin
  },
  mounted() {
    this.svg = d3.select(this.$el).select('svg')

    this.getWidthHeight()
    if (this.axis) {
      this.drawAxis()
    }
    window.addEventListener('resize', () => {
      this.getWidthHeight()
      if (this.axis) {
        this.redrawAxis()
      }
    })

    this.addBrush()

    window.addEventListener('keydown', evt => {
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
    boolDataHasAttribute(data, attrName) {
      return !data[0] || data[0][attrName]
    },
    getIdsFromData(data) {
      return data.map(d => d._nbid_)
    },
    getAxisDomainsFromData(data, x, y) {
      return [getDataExtent(data, x), getDataExtent(data, y)]
    },
    addBrush() {
      const brushG = this.svg.select('.brush-g')
      const onBrushEnd = () => {
        if (!d3.event.selection) return

        const [[x0, y0], [x1, y1]] = d3.event.selection
        const selection = []
        this.scaledData.forEach((d, i) => {
          if (d.x >= x0 && d.x <= x1 && d.y >= y0 && d.y <= y1) {
            selection.push(this.data[i]._nbid_)
          }
        })
        this.selection = selection
        this.$emit('selection', selection)

        if (!this.showBrush) {
          brushG.call(brush.clear)
        }
      }

      const xRange = this.scales.x.range()
      const yRange = this.scales.y.range()
      const brush = d3
        .brush()
        .extent([
          [xRange[0], yRange[1]],
          [xRange[1] + 1, yRange[0]],
        ])
        .on('end', onBrushEnd)

      brushG.selectAll('*').remove()
      brushG
        .call(brush)
        .select('.selection')
        .attr('stroke', null)
    },
    addZoom() {
      const xScale = this.scales.x.copy()
      const yScale = this.scales.y.copy()
      const onZoom = () => {
        const scale = [
          d3.event.transform.rescaleX(xScale).domain(),
          d3.event.transform.rescaleY(yScale).domain(),
        ]
        this.scale = scale
        this.$emit('scale', scale)
      }

      const zoom = d3.zoom().on('zoom', onZoom)
      const xRange = this.scales.x.range()
      const yRange = this.scales.y.range()
      this.svg.select('.zoom-g')
        .append('rect')
        .attr('x', xRange[0])
        .attr('y', yRange[1])
        .attr('width', xRange[1] - xRange[0])
        .attr('height', yRange[0] - yRange[1])
        .attr('fill', 'none')
        .attr('pointer-events', 'all')
        .call(zoom)
    },
    removeZoom() {
      this.svg.select('.zoom-g')
        .selectAll('*')
        .remove()
    },
    drawAxis() {
      this.removeAxis()
      // 绘制坐标轴
      this.margin = this.axisMargin
      const xRange = this.scales.x.range()
      const xAxis = d3.axisBottom().scale(this.scales.x)
      const yAxis = d3.axisLeft().scale(this.scales.y)
      this.svg
        .select('.x-axis')
        .call(xAxis)
        .append('text')
        .attr('class', 'axis-label')
        .attr('text-anchor', 'end')
        .attr('x', xRange[1])
        .attr('dy', '2.1em')
        .text(this.x)
      this.svg
        .select('.y-axis')
        .call(yAxis)
        .append('text')
        .attr('class', 'axis-label')
        .attr('text-anchor', 'start')
        .attr('x', -(this.margin - this.blankMargin))
        .attr('y', this.margin - this.blankMargin)
        .attr('dy', '0.32em')
        .text(this.y)
      this.svg
        .selectAll('.axis-label')
        .attr('fill', 'currentColor')
        .attr('font-size', 14)
      this.svg.selectAll('.axis text').style('user-select', 'none')
    },
    removeAxis() {
      // 去除坐标轴
      this.svg
        .selectAll('.axis *')
        .remove()
      this.margin = this.blankMargin
    },
    redrawAxis() {
      this.$nextTick(() => {
        this.drawAxis()
      })
    },
  },
})

function getDataExtent(data, key) {
  return d3.extent(data, d => d[key])
}

function getIthFieldOfType(data, n, type) {
  if (data.length === 0) {
    return undefined
  }
  const datum = data[0]
  if (typeof datum !== 'object') {
    return undefined
  }
  let count = 0
  for (const key of Object.keys(datum).sort()) {
    if (typeof datum[key] === type && count++ === n) {
      return key
    }
  }
}

function isArrayOfType(array, type, col, row) {
  if (!array) return false
  if (row === 1 && array.length > 1) {
    array = [array]
  }
  return Array.isArray(array) && array.length === row && array.every(r => {
    return Array.isArray(r) && r.length === col && r.every(c => typeof c === type)
  })
}
