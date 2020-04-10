import Scatterplot from '../visualizations/scatterplot'
import Areachart from '../visualizations/area_chart'
import LineUp from '../visualizations/line_up'
import NodeLinkGraph from '../visualizations/node_link_graph'

export default class VisManger {
  constructor(dataSources, layout, visSpec) {
    this.dataSources = dataSources
    this.layout = layout
    this.spec = visSpec
    this.charts = {}

    for (const chartSpec of this.spec) {
      if (chartSpec.id in this.charts)
        throw new Error('Vis ids cannot be repeated.')
      this.charts[chartSpec.id] = {
        spec: chartSpec,
        type: chartSpec.visualization,
        container: null,
        instance: null,
      }

      // 处理挂载点
      const chartContainerIndex = this.layout.containerNames.indexOf(
        chartSpec.container
      )
      if (chartContainerIndex !== -1) {
        this.charts[chartSpec.id].container = this.layout.containerNames[
          chartContainerIndex
        ]
      } else {
        const tmpContainerName = `_container_${chartSpec.id}`
        this.charts[chartSpec.id].container = tmpContainerName
        this.layout.addOneContainerToGrids(
          tmpContainerName,
          chartSpec.container
        )
      }

      // 生成可视化实例
      switch (this.charts[chartSpec.id].type.toLowerCase()) {
        case 'scatterplot':
          this.charts[chartSpec.id].instance = this._generateScatterplot(
            chartSpec.props
          )
          this.charts[chartSpec.id].instance.mount(
            this.charts[chartSpec.id].container
          )
          break
        case 'areachart':
          this.charts[chartSpec.id].instance = this._generateAreaChart(
            chartSpec.props
          )
          this.charts[chartSpec.id].instance.mount(
            this.charts[chartSpec.id].container
          )
          break
        case 'lineup':
          this.charts[chartSpec.id].instance = this._generateLineUp(
            chartSpec.props
          )
          this.charts[chartSpec.id].instance.mount(
            this.charts[chartSpec.id].container
          )
          break
        case 'graph':
          this.charts[chartSpec.id].instance = this._generateNodeLinkGraph(
            chartSpec.props
          )
          this.charts[chartSpec.id].instance.mount(
            this.charts[chartSpec.id].container
          )
          break
        default:
          break
      }
    }
  }

  getVisInstanceById(id) {
    return this.charts[id].instance
  }

  _generateScatterplot(propsSpec) {
    const props = { ...propsSpec }
    props.data = this.dataSources.getDataSourceByName(propsSpec.data).values
    return new Scatterplot(props)
  }

  _generateAreaChart(propsSpec) {
    const props = { ...propsSpec }
    props.data = this.dataSources.getDataSourceByName(propsSpec.data).values
    return new Areachart(props)
  }

  _generateLineUp(propsSpec) {
    const props = { ...propsSpec }
    props.data = this.dataSources.getDataSourceByName(propsSpec.data).values
    return new LineUp(props)
  }

  _generateNodeLinkGraph(propsSpec) {
    const props = { ...propsSpec }
    const data = this.dataSources.getDataSourceByName(propsSpec.data)
    props.data = { nodes: data.nodes, links: data.links }
    return new NodeLinkGraph(props)
  }
}
