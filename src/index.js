import Nebula from './spec-parser'
import spec from '../public/nb-spec/test-bar-chart.json'

const nebulaInstance = new Nebula('#app', spec)
nebulaInstance.init()
