import resolveData from '@src/resolveData'
import dataConfig from './data-config.json'

export default function run() {
  resolveData(dataConfig).then(data => console.log(data))
}
