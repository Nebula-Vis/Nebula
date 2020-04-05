import DataSource from './data'
import Layout from './layout'
import VisManager from './vis'

const parseSpec = async (spec) => {
  const dataSource = new DataSource(spec.data)
  await dataSource.init()

  const layout = new Layout(spec.layout)
  layout.mount('#app')

  // const vis = new VisManager(dataSource, spec.visualizations)
  // vis.init()
}

export default { parseSpec }