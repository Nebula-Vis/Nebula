import Nebula from '@/spec-parser'
import spec from '../public/nb-spec/testTree&TreeMap.json'

const nebulaInstance = new Nebula('#app', spec)
nebulaInstance.init()
