import * as d3 from 'd3'

/**
 * Renders a non-root layout object and its children
 * @param {Object} layoutConfig non-root layout config
 * @param {Object} parent the parent element
 * @param {Object} layoutMap map from id to div element
 */
const renderLayoutNode = (layoutConfig, parent, layoutMap) => {
  const { id, length, direction, children } = layoutConfig
  const node = parent
    .append('div')
    .style('min-width', 0)
    .style('min-height', 0)
    .style('display', 'flex')
    .style('flex-direction', direction || 'row')

  if (typeof length == 'number') {
    node.style('flex', `${length} ${length} 0`)
  } else if (typeof length == 'string') {
    node.style('flex', `0 0 ${length}`)
  } else {
    node.style('flex', '1 1 0')
    console.warn(`Layout: wrong length for ${id}, defaulting to 1.`)
  }

  if (id) {
    if (layoutMap[id]) {
      console.warn(`Layout: duplicate id ${id}`)
    }
    layoutMap[id] = node.node()
    node.attr('id', id)
  }

  if (!id && !Array.isArray(children)) {
    console.warn(`Layout: a leaf node with no id`)
  }

  if (Array.isArray(children)) {
    children.forEach(child => renderLayoutNode(child, node, layoutMap))
  }
}

/**
 * Resolve layout config
 * @param {Objecct} layoutConfig the layout object
 * @param {Element|string|undefined} container the layout container. if undefined, append div to body
 * @returns {Object} a map id -> div
 */
const resolveLayout = (layoutConfig, container) => {
  if (typeof layoutConfig !== 'object') {
    return
  }

  // a simple map of id -> HTMLDivElement
  const layoutMap = {}

  const root = (container
    ? d3.select(container)
    : d3.select('body').append('div')
  ) // if container is undefined, append div to body
    .append('div')

  const { id, width, height, direction, children } = layoutConfig
  root
    // assume absolute width and height for root // TODO
    .style('width', width)
    .style('height', height)
    .style('display', 'flex')
    .style('flex-direction', direction || 'row')

  if (id) {
    if (layoutMap[id]) {
      console.warn(`Layout: duplicate id ${id}`)
    }
    layoutMap[id] = root.node()
    root.attr('id', id)
  }

  if (!id && !Array.isArray(children)) {
    console.warn(`Layout: a leaf node with no id`)
  }

  if (Array.isArray(children)) {
    children.forEach(child => renderLayoutNode(child, root, layoutMap))
  }

  return layoutMap
}

export default resolveLayout
