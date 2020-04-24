<<<<<<< HEAD
import Nebula from './spec-parser'
import spec from '../public/nb-spec/test-bar-chart.json'
=======
import Nebula from '@/spec-parser'
import spec from '../public/nb-spec/test.json'
>>>>>>> origin/master

const nebulaInstance = new Nebula('#app', spec)
nebulaInstance.init()
