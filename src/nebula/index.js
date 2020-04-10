import DataSources from './data'
import Layout from './layout'
import VisManager from './vis'

const parseSpec = async (spec) => {
  const dataSources = new DataSources(spec.data)
  await dataSources.init()

  const layout = new Layout(spec.layout)
  layout.mount('#app')

  new VisManager(dataSources, layout, spec.visualizations)
  // vis.init()
}

export default { parseSpec }
