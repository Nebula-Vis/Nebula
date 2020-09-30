import Nebula from '@/spec-parser'
import spec from '../public/nb-spec/fig-srvis.json'
import './global.css'

const nebulaInstance = new Nebula('#app', spec)
nebulaInstance.init()
window.nebulaInstance = nebulaInstance
