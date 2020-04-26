import Vue from 'vue/dist/vue.js'
import * as d3 from 'd3'
import * as d3Ez from 'd3-ez'

export default Vue.extend({
  name: 'SectorChart',
  template: `
      <div class="Barchart-root">
          <svg width="100%" height="100%" ref="svg">
              <g>
                  <template v-for="(value,index) in data">
                      <path :id="index" :key="'path'+index"/>
                  </template>
              </g>
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
      innerRadius: 0,
      diff: 5, // segment distance when being chosen
      margin: {
        top: 20,
        right: 20,
        bottom: 30,
        left: 40,
      },
      isMounted: false,
      disableClick: false,

      // 杂七杂八param
      axisMargin: 40,
      blankMargin: 10,
      size: 4,
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
      return svg
    },
    getPath() {
      const svg = this.$refs.svg
      return d3
        .select(svg)
        .attr('viewBox', [
          -this.width / 2,
          -this.height / 2,
          this.width,
          this.height,
        ])
        .selectAll('path')
    },

    arcLabel() {
      const radius = this.outerRadius
      return d3
        .arc()
        .innerRadius(0)
        .outerRadius((d) => (radius * d.value) / this.maxValue)
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
      return this.pie(this.data)
    },
    arc() {
      const radius = this.outerRadius
      const inner = this.innerRadius
      const innerRadius = inner * radius
      return d3
        .arc()
        .innerRadius(innerRadius)
        .outerRadius(
          (d) => (radius * (1 - inner) * d.value) / this.maxValue + innerRadius
        )
    },
    arcOver() {
      const radius = this.outerRadius
      const inner = this.innerRadius
      const innerRadius = radius * inner
      const diff = this.diff
      return d3
        .arc()
        .innerRadius(innerRadius + diff)
        .outerRadius(
          (d) =>
            (radius * (1 - inner) * d.value) / this.maxValue +
            diff +
            innerRadius
        )
    },
    maxValue() {
      const data = this.data
      const value = this.value
      return d3.max(data, function (d) {
        return d[value]
      })
    },
    color() {
      const data = this.data
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
  },
  watch: {
    selection: function () {
      // highlight the selected path
      this.parse()
      this.drawArc()
    },
    data: function () {
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
    or(d) {
      const sqrtD = Math.sqrt(d)
      return Math.max(d, sqrtD)
    },
    parse() {
      const selection = this.selection
      for (const i in this.data) {
        const temp = this.data[i]
        let flag = false
        for (const j in selection) {
          if (selection[j]['_nbid_'] === temp['_nbid_']) {
            flag = true
            break
          }
        }
        temp.selected = flag
      }
    },
    drawArc: function () {
      // draw all arcs
      const color = this.color
      const arcs = this.arcs
      const arc = this.arc
      const arcOver = this.arcOver
      const max = this.maxValue
      const path = this.getPath
      const name = this.name
      const data = this.data
      path
        .data(arcs)
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
            this.selection.push(data[i])
          }
          this.$emit('selection', JSON.stringify(this.selection))
          d.data.selected = !d.data.selected
        })
    },
  },
})
