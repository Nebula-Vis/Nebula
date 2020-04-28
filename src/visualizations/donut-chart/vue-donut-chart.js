import Vue from 'vue/dist/vue.js'
import * as d3 from 'd3'

export default Vue.extend({
  name: 'DonutChart',
  template: `
      <div class="Donutchart-root">
          <svg width="100%" height="100%" ref="svg">
<!--              <g>-->
<!--                  <template v-for="(value,index) in aggregateData">-->
<!--                      <path :id="index" :key="'path'+index"/>-->
<!--                  </template>-->
<!--              </g>-->
              <!-- <line v-show="!isDisplayAxis" ref="line"></line> -->
          </svg>
      </div>
  `,
  data() {
    return {
      id: '',
      data: [],
      selection: null,
      name: '',
      value: '',
      sort: '',
      aggregate: '',
      aggregateData: [],
      innerRadius: 0,
      count: null, // if data bin
      diff: 5,
      margin: {
        top: 20,
        right: 20,
        bottom: 30,
        left: 40,
      },
      isMounted: false,
      disableClick: false,
    }
  },
  computed: {
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
    outerRadius() {
      const margin = this.margin
      const width = this.width - margin.left - margin.right
      const height = this.height - margin.top - margin.bottom

      return Math.min(width, height) / 2
    },
    getSvg() {
      // get svg element
      const svg = this.$refs.svg
      svg.innerHTML = ''
      return d3
        .select(svg)
        .attr('viewBox', [
          -this.width / 2,
          -this.height / 2,
          this.width,
          this.height,
        ])
    },

    arcLabel() {
      const radius = this.outerRadius
      const innerRadius = this.innerRadius
      return d3
        .arc()
        .innerRadius(radius * innerRadius)
        .outerRadius(radius)
    },
    pie() {
      const value = this.value
      return (
        d3
          .pie()
          .sort(null)
          // eslint-disable-next-line no-undef
          .value((d) => d[value])
      )
    },
    arcs() {
      return this.pie(this.aggregateData)
    },
    arc() {
      const radius = this.outerRadius
      const innerRadius = this.innerRadius
      return d3
        .arc()
        .innerRadius(radius * innerRadius)
        .outerRadius(radius)
    },
    arcOver() {
      const radius = this.outerRadius
      const innerRadius = this.innerRadius
      const diff = this.diff
      return d3
        .arc()
        .innerRadius(radius * innerRadius + diff)
        .outerRadius(radius + diff)
    },
    color() {
      const data = this.aggregateData
      const name = this.name
      return d3
        .scaleOrdinal()
        .domain(data.map((d) => d[name]))
        .range(
          d3
            .quantize((t) => d3.interpolateSpectral(t * 0.8 + 0.1), data.length)
            .reverse()
        )
    },
    rangeMin() {
      const data = this.data
      const name = this.name
      return d3.min(data, function (d) {
        return d[name]
      })
    },
    rangeMax() {
      const data = this.data
      const name = this.name
      return d3.max(data, function (d) {
        return d[name]
      })
    },
  },
  watch: {
    selection: function () {
      // highlight the selected rect
      this.parse()
      this.drawArc()
    },
    data: function () {
      this.parse()
      this.drawArc()
      this.selection = []
    },
  },
  mounted() {
    this.isMounted = true
    this.parse()
    this.drawArc()
  },
  methods: {
    parse() {
      const selection = this.selection
      const aggregateData = {}
      const aggregate = this.aggregate
      const name = this.name
      const value = this.value
      const count = this.count
      for (const i in this.data) {
        const temp = this.data[i]
        if (aggregateData[temp[name]] === undefined) {
          aggregateData[temp[name]] = []
          aggregateData[temp[name]].origin = []
        }
        aggregateData[temp[name]].origin.push(temp)
        aggregateData[temp[name]].push(temp[value])
      }
      const data = []
      if (count === undefined || count === null) {
        for (const i in aggregateData) {
          const singleData = {}
          singleData[name] = i
          singleData['data'] = aggregateData[i]
          singleData['origin'] = aggregateData[i].origin
          data.push(singleData)
        }
        for (const i in data) {
          const temp = data[i]
          switch (aggregate) {
            case 'sum':
              temp[value] = d3.sum(temp.data)
              break
            case 'average':
              temp[value] = d3.sum(temp.data) / temp.data.length
              break
            case 'max':
              temp[value] = d3.max(temp.data)
              break
            case 'min':
              temp[value] = d3.min(temp.data)
              break
            default:
              temp[value] = d3.sum(temp.data)
              break
          }
          let flag = false
          for (const k in temp.origin) {
            for (const j in selection) {
              if (selection[j]['_nbid_'] === temp.origin[k]._nbid_) {
                flag = true
                break
              }
            }
            if (flag === true) {
              break
            }
          }
          temp.selected = flag
        }
      } else {
        const _low = this.rangeMin
        const _upper = this.rangeMax
        const interval = (_upper - _low) / count
        for (let i = 0; i < count; i++) {
          const tempData = {}
          tempData._low = _low + i * interval
          tempData._upper = _low + (i + 1) * interval
          tempData['data'] = []
          tempData['origin'] = []
          data.push(tempData)
        }
        for (const i in aggregateData) {
          let index = Math.floor((i - _low) / interval)
          if (index === count) index--
          for (let j = 0; j < aggregateData[i].length; j++) {
            data[index].data.push(aggregateData[i][j])
            data[index].origin.push(aggregateData[i].origin[j])
          }
        }
        for (const i in data) {
          const temp = data[i]
          temp[name] = `${temp._low.toFixed(1)}-${temp._upper.toFixed(1)}`
          switch (aggregate) {
            case 'sum':
              temp[value] = d3.sum(temp.data)
              break
            case 'average':
              temp[value] = d3.sum(temp.data) / temp.data.length
              break
            case 'max':
              temp[value] = d3.max(temp.data)
              break
            case 'min':
              temp[value] = d3.min(temp.data)
              break
            default:
              temp[value] = d3.sum(temp.data)
              break
          }
          let flag = false
          for (const k in temp.origin) {
            for (const j in selection) {
              if (selection[j]['_nbid_'] === temp.origin[k]._nbid_) {
                flag = true
                break
              }
            }
            if (flag === true) {
              break
            }
          }
          temp.selected = flag
        }
      }

      this.aggregateData = data
    },
    drawArc: function () {
      // draw all arcs
      const color = this.color
      const arcs = this.arcs
      const arc = this.arc
      const arcOver = this.arcOver
      const svg = this.getSvg
      const name = this.name
      const value = this.value
      const data = this.aggregateData
      const arcLabel = this.arcLabel

      svg.selectAll('g').remove()
      svg
        .append('g')
        .attr('stroke', 'white')
        .selectAll('path')
        .data(arcs)
        .join('path')
        .attr('d', function (d) {
          if (d.data.selected) {
            return arcOver(d)
          } else {
            return arc(d)
          }
        })
        .attr('fill', (d) => color(d.data[name]))
        .attr('cursor', 'pointer')
        .on('click', (d, i, nodes) => {
          // eslint-disable-next-line no-array-constructor
          this.selection = []
          if (!d.data.selected) {
            for (let j = 0; j < data[i].origin.length; j++) {
              this.selection.push(data[i].origin[j])
            }
          }
          this.$emit('selection', JSON.stringify(this.selection))
          d.data.selected = !d.data.selected
        })
        .on('mouseover', (d) => {
          if (d.endAngle - d.startAngle < 0.5)
            d3.select(`#donut_chart_text${d['index']}`)
              .style('display', 'unset')
              .style('z-index', 999)
        })
        .on('mouseout', (d) => {
          if (d.endAngle - d.startAngle < 0.5)
            d3.select(`#donut_chart_text${d['index']}`).style('display', 'none')
        })

      svg
        .append('g')
        .attr('font-family', 'sans-serif')
        .attr('font-size', 10)
        .attr('text-anchor', 'middle')
        .selectAll('text')
        .data(arcs)
        .join('text')
        .attr('id', (d) => `donut_chart_text${d['index']}`)
        .style('display', (d) => {
          if (d.endAngle - d.startAngle < 0.5) return 'none'
        })
        .attr('transform', (d) => `translate(${arcLabel.centroid(d)})`)
        .call((text) =>
          text
            // .filter((d) => d.endAngle - d.startAngle > 0.5)
            .append('tspan')
            .attr('y', '-0.4em')
            .attr('font-weight', 'bold')
            .text((d) => d.data[name])
        )
        .call((text) =>
          text
            // .filter((d) => d.endAngle - d.startAngle > 0.5)
            .append('tspan')
            .attr('x', 0)
            .attr('y', '0.7em')
            .attr('fill-opacity', 0.7)
            .text((d) => d.data[value].toLocaleString())
        )
    },
  },
})
