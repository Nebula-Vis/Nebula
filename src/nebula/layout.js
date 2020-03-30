
const renderLayout = (el, layout) => {
  const container = this.renderRootNodeLayout(el, layout.direction, layout.width, layout.height)
  this.renderChildrenLayout(container, layout.children)
}

const renderRootNodeLayout = (el, direction, width, height) => {
  const container = d3.select(el)
    .append('div')
    .style('display', 'flex')
    .style('flex-direction', direction)
    .style('width', width)
    .style('height', height)
  return container
}

const renderChildrenLayout = (container, children) => {
  for (const child of children) {
    const childElement = container.append('div')
    
    if (typeof child.length == 'number') childElement.style('flex', `${child.length} ${child.length}`) 
    else if (typeof child.length == 'string') childElement.style('flex', `0 0 ${child.length}`)  

    if (child.id) childElement.attr('id', child.id)
    if (child.direction) childElement.style('display', 'flex').style('flex-direction', child.direction)
    
    if (child.children) this.renderChildrenLayout(childElement, child.children)
    // mount point
    else childElement.append('div').attr('id', `${child.id}-mount`)
  }
}

