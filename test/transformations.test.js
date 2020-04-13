import { describe, it } from 'mocha'
import assert from 'assert'
import Intersect from '../src/transformations/intersect'

describe('transformation', () => {
  const intersect = new Intersect()

  describe('intersect', () => {
    it('The intersection of [1, 2, 3] and [1, 2] is [1, 2]', () => {
      assert.deepStrictEqual(
        intersect.run([
          [1, 2, 3],
          [1, 2],
        ]),
        [1, 2]
      )
    })

    it('The intersection of [{ x: 1 }] and [{ x: 2 }, { x: 1 }] is [{ x: 1 }]', () => {
      assert.deepStrictEqual(
        intersect.run([[{ x: 1 }], [{ x: 2 }, { x: 1 }]], 'x'),
        [{ x: 1 }]
      )
    })
  })
})
