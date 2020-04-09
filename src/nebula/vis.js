import Scatterplot from '../visualizations/scatterplot'
import Areachart from '../visualizations/area_chart'

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
          // mount
          break
        case 'areachart':
          break
        case 'lineup':
          break
        case 'graph':
          break
      }
      
        
    })
    this.charts = charts
  }

  _generateScatterplot(propsSpec) {
    const props = { ...propsSpec }
    props.data = this.dataSources.getDataSourceByName(propsSpec.data).values
    console.log(props)
    return new Scatterplot(props)
  }
}


