import DataSources from './data'
import Layout from './layout'
import VisManager from './vis'
import CoordinationManager from './coordination'

const parseSpec = async (spec) => {
  const dataSources = new DataSources(spec.data)
  await dataSources.init()

  const layout = new Layout(spec.layout)
  layout.mount('#app')

  const visManager = new VisManager(dataSources, layout, spec.visualizations)

  spec.coordination
    ? new CoordinationManager(dataSources, visManager, spec.coordination)
    : null
}

export default { parseSpec }
