import * as d3 from 'd3'

// TODO: 健壮性
export default class Layout {
  constructor(spec) {
    this.spec = spec
    this.layout = this._generateLayoutBySpec(this.spec)
  }

  _generateLayoutBySpec(spec) {
    const grids = this._generateGrids(spec.width, spec.height, spec.rows, spec.columns)
    this._addContainersToGrids(grids, spec.containers)
    return grids
  }

  _generateGrids(width, height, rows, columns) {
    return d3.create('div')
      .style('display', 'grid')
      .style('width', width)
      .style('height', height)
      .style('grid-template-rows', rows.reduce((total, current) => `${total} ${current}`, ""))
      .style('grid-template-columns', columns.reduce((total, current) => `${total} ${current}`, ""))
  }

  _addContainersToGrids(grids, containers) {
    for (const container of containers) {
      const gridlines = container.grids.split(' ').map(str => Number(str))
      grids.append('div')
        .attr('id', container.name)
        .style('grid-row-start', gridlines[0])
        .style('grid-row-end', gridlines[1] + 1)
        .style('grid-column-start', gridlines[2])
        .style('grid-column-end', gridlines[3] + 1)
    }
  }

  mount(selector) {
    const layoutElement = this.layout.node()
    d3.select(selector)
      .append(() => layoutElement)
  }
}
