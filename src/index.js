import Nebula from '@/spec-parser'
import spec from '../public/nb-spec/test_piechart.json'

const nebulaInstance = new Nebula('#app', spec)
nebulaInstance.init()
