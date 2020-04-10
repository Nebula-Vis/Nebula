import Scatterplot from '../visualizations/scatterplot'
import Areachart from '../visualizations/area_chart'
import LineUp from '../visualizations/line_up'
import NodeLinkGraph from '../visualizations/node_link_graph'

export default class VisManger {
  constructor(dataSources, layout, visSpec) {
    this.dataSources = dataSources
    this.layout = layout
    this.spec = visSpec
    const charts = this.spec.map((chartSpec, i) => {
      const chart = {
        spec: chartSpec,
        id: chartSpec.id,
        container: null,
        type: chartSpec.visualization,
        instance: null,
      }

      // 处理挂载点
      const chartContainerIndex = this.layout.containerNames.indexOf(chartSpec.container)
      if (chartContainerIndex != -1) {
        chart.container = this.layout.containerNames[chartContainerIndex]
      } else {
        const tmpContainerName = `_container${i}`
        chart.container = tmpContainerName
        this.layout.addOneContainerToGrids(tmpContainerName, chartSpec.container)
      }

      // 生成可视化实例
      switch(chart.type.toLowerCase()) {
        case 'scatterplot':
          chart.instance = this._generateScatterplot(chartSpec.props)
          chart.instance.mount(chart.container)
          break
        case 'areachart':
          chart.instance = this._generateAreaChart(chartSpec.props)
          chart.instance.mount(chart.container)
          break
        case 'lineup':
          chart.instance = this._generateLineUp(chartSpec.props)
          chart.instance.mount(chart.container)
          break
        case 'graph':
          chart.instance = this._generateNodeLinkGraph(chartSpec.props)
          chart.instance.mount(chart.container)
          break
      }

    })
    this.charts = charts
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
