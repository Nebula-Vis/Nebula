import Nebula from '@/spec-parser'
import spec from '../public/nb-spec/revise-select-set.json'
import './global.css'

const nebulaInstance = new Nebula('#app', spec)
nebulaInstance.init()
window.nebulaInstance = nebulaInstance
