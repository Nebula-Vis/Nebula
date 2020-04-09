import * as d3 from 'd3'

// TODO: 健壮性
export default class Layout {
  constructor(spec) {
    this.spec = spec
    this.containerNames = spec.containers.map(container => container.name)
    this.layout = this._generateGridsBySpec(this.spec)
    this._addContainersToGridsBySpec(spec.containers)
  }

  _generateGridsBySpec(spec) {
    return d3.create('div')
      .style('display', 'grid')
      .style('width', spec.width)
      .style('height', spec.height)
      .style('grid-template-rows', spec.rows.reduce((total, current) => `${total} ${current}`, ""))
      .style('grid-template-columns', spec.columns.reduce((total, current) => `${total} ${current}`, ""))
  }

  _addContainersToGridsBySpec(containers) {
    containers.forEach(container => {
      this.addOneContainerToGrids(container.name, container.grids)
    })
  }

  addOneContainerToGrids(containerId, gridsInterval) {
    const gridlines = gridsInterval.split(' ').map(str => Number(str))
    this.layout.append('div')
      .attr('id', containerId)
      .style('grid-row-start', gridlines[0])
      .style('grid-row-end', gridlines[1] + 1)
      .style('grid-column-start', gridlines[2])
      .style('grid-column-end', gridlines[3] + 1)
  }

  mount(selector) {
    const layoutElement = this.layout.node()
    d3.select(selector)
      .append(() => layoutElement)
  }
}
