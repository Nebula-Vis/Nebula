import resolveTransformLib from '@src/resolveTransformLib'
import transformsConfig from './transforms-config.json'

export default function run() {
  const transformLib = resolveTransformLib(transformsConfig)
  Object.entries(transformLib).forEach(([key, value]) => {
    console.log(key, value.spec)
  })
}
