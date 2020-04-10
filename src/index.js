import Nebula from './nebula/spec-parser'
import spec from '../static/test.json'

const nebulaInstance = new Nebula('#app', spec)
nebulaInstance.init()
