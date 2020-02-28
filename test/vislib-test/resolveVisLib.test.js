import Vue from 'vue'
import resolveVisLib from '../../src/resolveVisLib'

export default function run() {
  const visLib = resolveVisLib()
  Object.entries(visLib).forEach(([key, value]) => {
    console.log(key, value.prototype instanceof Vue)
  })
}
