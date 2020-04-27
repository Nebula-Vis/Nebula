import Vue from 'vue/dist/vue.js'
import * as d3 from 'd3'

export default Vue.extend({
  name: 'SunburstChart',
  template: `
      <div class="SunburstChart-root">
          <svg width="100%" height="100%" ref="svg">
              <!-- <line v-show="!isDisplayAxis" ref="line"></line> -->
          </svg>
      </div>
  `,
  data() {
    return {
      id: '',
      if_init: false,
      rootData: null,
      data: null,
      selection: null,
      currentSelect: null,
      margin: {
        top: 20,
        right: 20,
        bottom: 30,
        left: 40,
      },
      isMounted: false,
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
    radius() {
      const margin = this.margin
      const width = this.width - margin.left - margin.right
      const height = this.height - margin.top - margin.bottom
      return Math.min(width, height) / 6
    },
    getSvg() {
      // get svg element
      const svg = this.$refs.svg
      return svg
    },
    color() {
      const data = this.rootData
      return d3.scaleOrdinal(
        d3.quantize(d3.interpolateRainbow, data.children.length + 1)
      )
    },
    arc() {
      const radius = this.radius
      return d3
        .arc()
        .startAngle((d) => d.x0)
        .endAngle((d) => d.x1)
        .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.005))
        .padRadius(radius * 1.5)
        .innerRadius((d) => d.y0 * radius)
        .outerRadius((d) => Math.max(d.y0 * radius, d.y1 * radius - 1))
    },
  },
  watch: {
    selection: function () {
      console.log(this.selection)
      console.log(this.currentSelect)
      if (this.selection === undefined) this.drawArc()
      else if (this.selection.name !== this.currentSelect) {
        this.drawArc()
      }
      // if(this.selection[0])
      // this.drawArc()
    },
    data: function () {
      this.drawArc()
      // this.selection = []
    },
  },
  mounted() {
    this.isMounted = true
    this.rootData = this.data
    this.drawArc()
    if (!this.if_init) {
      this.currentSelect = this.data.name
      this.if_init = true
    }
  },
  methods: {
    format: function (d) {
      return d3.format(`.${d}`)
    },
    partition: function (data) {
      const root = d3
        .hierarchy(data)
        .sum((d) => d.value)
        .sort((a, b) => b.value - a.value)
      return d3.partition().size([2 * Math.PI, root.height + 1])(root)
    },
    drawArc: function () {
      const that = this
      // draw all arcs
      const data = this.data
      const root = this.partition(data)
      const height = this.height
      const width = this.width
      const radius = this.radius
      const color = this.color
      root.each((d) => (d.current = d))
      const arc = this.arc
      this.getSvg.innerHTML = ''
      const svg = d3.select(this.getSvg)
      svg
        .attr('viewBox', [0, 0, width, height])
        .style('font', '10px sans-serif')

      const g = svg
        .append('g')
        .attr('transform', `translate(${width / 2},${width / 2})`)

      const path = g
        .append('g')
        .selectAll('path')
        .data(root.descendants().slice(1))
        .join('path')
        .attr('fill', (d) => {
          while (d.depth > 1) d = d.parent
          return color(d.data.name)
        })
        .attr('fill-opacity', (d) =>
          arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0
        )
        .attr('d', (d) => arc(d.current))

      path
        .filter((d) => d.children)
        .style('cursor', 'pointer')
        .on('click', clicked)

      path.append('title').text(
        (d) =>
          `${d
            .ancestors()
            .map((d) => d.data.name)
            .reverse()
            .join('/')}\n${this.format(d.value)}`
      )

      const label = g
        .append('g')
        .attr('pointer-events', 'none')
        .attr('text-anchor', 'middle')
        .style('user-select', 'none')
        .selectAll('text')
        .data(root.descendants().slice(1))
        .join('text')
        .attr('dy', '0.35em')
        .attr('fill-opacity', (d) => +labelVisible(d.current))
        .attr('transform', (d) => labelTransform(d.current))
        .text((d) => d.data.name)

      const parent = g
        .append('circle')
        .datum(root)
        .attr('r', radius)
        .attr('fill', 'none')
        .attr('pointer-events', 'all')
        .on('click', clicked)

      function clicked(p) {
        if (that.currentSelect !== p.data.name) {
          const selection = []
          selection.push(p.data.name)
          console.log(selection)
          that.currentSelect = p.data.name
          // that.$emit('selection', JSON.stringify(selection))
        }
        parent.datum(p.parent || root)
        root.each(
          (d) =>
            (d.target = {
              x0:
                Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) *
                2 *
                Math.PI,
              x1:
                Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) *
                2 *
                Math.PI,
              y0: Math.max(0, d.y0 - p.depth),
              y1: Math.max(0, d.y1 - p.depth),
            })
        )

        const t = g.transition().duration(750)

        // Transition the data on all arcs, even the ones that aren’t visible,
        // so that if this transition is interrupted, entering arcs will start
        // the next transition from the desired position.
        path
          .transition(t)
          .tween('data', (d) => {
            const i = d3.interpolate(d.current, d.target)
            return (t) => (d.current = i(t))
          })
          .filter(function (d) {
            return +this.getAttribute('fill-opacity') || arcVisible(d.target)
          })
          .attr('fill-opacity', (d) =>
            arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0
          )
          .attrTween('d', (d) => () => arc(d.current))

        label
          .filter(function (d) {
            return +this.getAttribute('fill-opacity') || labelVisible(d.target)
          })
          .transition(t)
          .attr('fill-opacity', (d) => +labelVisible(d.target))
          .attrTween('transform', (d) => () => labelTransform(d.current))
      }

      function arcVisible(d) {
        return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0
      }

      function labelVisible(d) {
        return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03
      }

      function labelTransform(d) {
        const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI
        const y = ((d.y0 + d.y1) / 2) * radius
        return `rotate(${x - 90}) translate(${y},0) rotate(${
          x < 180 ? 0 : 180
        })`
      }
    },
  },
})
