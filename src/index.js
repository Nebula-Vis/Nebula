import Nebula from './spec-parser'
import spec from '../public/nb-spec/test.json'

const nebulaInstance = new Nebula('#app', spec)
nebulaInstance.init()
