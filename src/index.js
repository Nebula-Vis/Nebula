import Nebula from '@/spec-parser'
import spec from '../public/nb-spec/fig-ccpca.json'

const nebulaInstance = new Nebula('#app', spec)
nebulaInstance.init()
window.nebulaInstance = nebulaInstance
