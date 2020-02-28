import Vue from 'vue'
import * as ZjVis from 'zjlab-vis'

/**
 * Convert visualization components into a name -> VueConstructor map
 * @returns {{[name: string]: import('vue').VueConstructor}}
 */
const resolveVis = () => {
  const VisLib = {}
  Object.values(ZjVis).forEach(compOption => {
    if (compOption && compOption.name) {
      VisLib[compOption.name] = Vue.extend(compOption)
    }
  })

  return VisLib
}

export default resolveVis
