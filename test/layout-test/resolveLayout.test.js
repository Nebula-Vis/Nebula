import * as d3 from 'd3'
import resolveLayout from '../../src/resolveLayout'
import layoutConfig from './layout-config.json'

const getConfigMap = (layoutConfig, configMap) => {
  if (layoutConfig.id) {
    const config = { ...layoutConfig }
    if (config.children) {
      delete config.children
    }
    configMap[layoutConfig.id] = config
  }

  if (Array.isArray(layoutConfig.children)) {
    layoutConfig.children.forEach(child => getConfigMap(child, configMap))
  }
}

export default function run() {
  const configMap = {}
  getConfigMap(layoutConfig, configMap)

  const layoutMap = resolveLayout(layoutConfig)
  console.log(layoutMap)

  Object.entries(layoutMap).forEach(([id, node]) => {
    d3.select(node)
      .style('background', 'rgba(0, 120, 250, 0.2)')
      .style('border', '1px solid rgb(0, 120, 250)')
      .style('display', 'flex')
      .style('justify-content', 'center')
      .style('align-items', 'center')
      .append('div')
      .append('pre')
      .text(JSON.stringify(configMap[id], null, 2))
  })
}
