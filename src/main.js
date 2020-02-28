// import Vue from 'vue'
// import * as ZjVis from 'zjlab-vis'
// import Compiler from './compiler'
// import config from '../config/example.json'

// const lib = {} // string -> vue constructor
// Object.entries(ZjVis).forEach(([exportName, exportValue]) => {
//   if (exportName !== 'default' && exportValue.name) {
//     lib[exportValue.name] = Vue.extend(exportValue)
//   }
// })

// const compiler = new Compiler(config, lib)
// const begin = async compiler => {
//   await compiler.generateDataStore()
//   compiler.render('#app')
// }
// begin(compiler)

import resolveData from './resolveData'
import dataConfig from '../test/data-test/data-config.json'

resolveData(dataConfig).then(data => console.log(data))
