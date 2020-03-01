import _ from 'lodash'
import resolveTransformLib from '@src/resolveTransformLib'
import transformsConfig from './transforms-config.json'

export default function run() {
  const transformLib = resolveTransformLib(transformsConfig.customSpec)
  Object.entries(transformLib).forEach(([key, value]) => {
    console.log(key, value.spec)
  })

  transformsConfig.tests.forEach(async ({ name, cases }) => {
    const transformation = transformLib[name]
    cases.forEach(async c => {
      let res
      try {
        res = await transformation.run(c.input).catch(() => {
          console.error(`Test TransformLib: error executing transform ${name}`)
        })
        if (!_.isEqual(res, c.output)) {
          console.error(
            `Test TransformLib: wrong output of transform ${name},
            input:`,
            c.input,
            'expected:',
            c.output,
            'got',
            res
          )
        }
      } catch (e) {
        console.error(`Test TransformLib: error executing transform ${name}`)
      }
    })
  })
}
