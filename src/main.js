import Compiler from './compiler'
import config from '../config/example.json'

const compiler = new Compiler(config)
compiler.compile('#app')
