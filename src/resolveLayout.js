import * as d3 from 'd3'

/**
 * Renders a non-root layout object and its children
 * @param {Object} layoutConfig non-root layout config
 * @param {Object} parent the parent element
 * @param {Object} layoutMap map from id to div element
 */
const renderLayoutNode = (layoutConfig, parent, layoutMap) => {
  if (!layoutConfig) {
    return
  }
  let { id, length, direction, children } = layoutConfig
  if (direction !== 'row' && direction !== 'column') {
    direction = 'row'
  }
  const node = parent
    .append('div')
    .style('min-width', 0)
    .style('min-height', 0)
    .style('display', 'flex')
    .style('flex-direction', direction)

  if (typeof length == 'number') {
    node.style('flex', `${length} ${length} 0`)
  } else if (typeof length == 'string') {
    node.style('flex', `0 0 ${length}`)
  } else {
    node.style('flex', '1 1 0')
    console.warn(`Layout: wrong length for ${id}, defaulting to 1.`)
  }

  if (id && typeof id === 'string') {
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
  // a simple map of id -> HTMLDivElement
  const layoutMap = {}

  if (typeof layoutConfig !== 'object') {
    return layoutMap
  }

  let { id, width, height, direction, children } = layoutConfig
  if (typeof width !== 'string' && typeof width !== 'number') {
    console.error('Layout: root node with no width')
    return layoutMap
  }
  if (typeof height !== 'string' && typeof height !== 'number') {
    console.error('Layout: root node with no height')
    return layoutMap
  }
  if (direction !== 'row' && direction !== 'column') {
    direction = 'row'
  }

  let root
  if (container && !d3.select(container).empty()) {
    root = d3.select(container).append('div')
  } else {
    root = d3.select('body').append('div')
  }

  root
    // assume absolute width and height for root // TODO
    .style('width', typeof width === 'number' ? `${width}px` : width)
    .style('height', typeof height === 'number' ? `${height}px` : height)
    .style('display', 'flex')
    .style('flex-direction', direction)

  if (id && typeof id === 'string') {
    if (layoutMap[id]) {
      console.warn(`Layout: duplicate id ${id}`)
    }
    layoutMap[id] = root.node()
    root.attr('id', id)
  }

  // if (!id && !Array.isArray(children)) {
  //   console.warn(`Layout: a leaf node with no id`)
  // }

  if (Array.isArray(children)) {
    children.forEach(child => renderLayoutNode(child, root, layoutMap))
  }

  return layoutMap
}

export default resolveLayout
