import * as d3 from 'd3'

// TODO：健壮性有待增强
export default class Layout {
  constructor(spec) {
    this.spec = spec
    this.layout = this.getLayoutBySpec(this.spec)
  }

  getLayoutBySpec(spec) {
    if (!spec.width || !spec.height || !spec.direction)
      throw "Layour root error."
    const root = this.getRootBySpec(spec.width, spec.height, spec.direction)
    this.insertChildrenInRoot(root, spec.children)
    return root
  }

  getRootBySpec(width, height, dir) {
    return d3.create('div')
      .style('display', 'flex')
      .style('flex-direction', dir)
      .style('width', width)
      .style('height', height)
  }

  insertChildrenInRoot(root, childrenSpec) {
    for (const childSpec of childrenSpec) {
      const element = root.append('div')
 
      if (!childSpec.length)
        throw "Layout children error."

      const length = childSpec.length
      if (typeof length == 'number') element.style('flex', `${length} ${length}`)
      else if (typeof length == 'string') element.style('flex', `0 0 ${length}`)

      if (childSpec.id) element.attr('id', childSpec.id)
      if (childSpec.direction) element.style('display', 'flex').style('flex-direction', childSpec.direction)

      if (childSpec.children) this.insertChildrenInRoot(element, childSpec.children)
      // mount point：是否需要，后面研究下
      else element.append('div').attr('id', `${childSpec.id}-mount`)
    }
  }

  mount(selector) {
    const layoutElement = this.layout.node()
    d3.select(selector)
      .append(() => layoutElement)
  }
}
