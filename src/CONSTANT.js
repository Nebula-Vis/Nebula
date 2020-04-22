// import _ from 'lodash'

export const ACTIONS = [
  'select',
  'filter',
  'navigate',
  'set data',
  'replace data',
  'append data',
  'encode',
  'reconfigure',
]

export const OPTIONS = ['items', 'ranges', 'x', 'y', 'color', 'order', 'size']

export const ACTION_TO_OPTIONS = {
  select: ['items', 'ranges'],

  'set data': ['items'],
  'replace data': ['items'],
  'append data': ['items'],
  encode: ['x', 'y', 'color', 'size', 'color'],
  reconfigure: ['order'],
}

// export const ACTIONS = Object.keys(ACTION_TO_OPTIONS)
// export const OPTIONS = _.uniq(_.flatten(Object.values(ACTION_TO_OPTIONS)))
