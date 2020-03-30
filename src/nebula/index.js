import DataSources from './data';

const parseSpec = async (spec) => {
  const dataSources = new DataSources(spec.data)
  await dataSources.init()
}

export default { parseSpec }