import * as d3 from 'd3'

/**
 * Init
 * const layoutParser = new DataSpecParser(spec)
 */
export default class LayoutSpecParser {
  constructor(spec) {
    if (!spec) throw new TypeError('No layout specification')
    this._spec = spec
  }

  generateLayout() {
    this._layoutElement = this._generateGridLayoutElementBySpec(this._spec)
    const layout = new Layout(this._layoutElement)
    if (this._spec.containers) {
      this._spec.containers.forEach((containerSpec) => {
        layout.addContainer(containerSpec.name, containerSpec.grids)
      })
    }
    return layout
  }

  _generateGridLayoutElementBySpec(spec) {
    return d3
      .create('div')
      .style('display', 'grid')
      .style('width', spec.width)
      .style('height', spec.height)
      .style(
        'grid-template-rows',
        spec.rows.reduce((total, current) => `${total} ${current}`, '')
      )
      .style(
        'grid-template-columns',
        spec.columns.reduce((total, current) => `${total} ${current}`, '')
      )
  }
}

// Grid Layout
class Layout {
  constructor(element) {
    this._layoutElement = element // d3 selection element
    this._containerNames = []
  }

  addContainer(containerName, gridsInterval) {
    if (this.isContainerNameExist(containerName))
      throw new SyntaxError(`Repeated container name ${containerName}.`)
    const gridAttrs = gridsInterval.split(' ').map((str) => Number(str))
    this._layoutElement
      .append('div')
      .attr('id', containerName)
      .style('grid-row-start', gridAttrs[0])
      .style('grid-row-end', gridAttrs[1] + 1)
      .style('grid-column-start', gridAttrs[2])
      .style('grid-column-end', gridAttrs[3] + 1)
    this._containerNames.push(containerName)
  }

  isContainerNameExist(name) {
    return this._containerNames.indexOf(name) === -1 ? false : true
  }

  mount(selector) {
    const layoutDomElement = this._layoutElement.node()
    d3.select(selector).append(() => layoutDomElement)
  }
}
