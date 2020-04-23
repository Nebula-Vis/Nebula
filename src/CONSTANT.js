// import _ from 'lodash'

export const ACTIONS = [
  'select',
  'filter', //
  'navigate', //
  'encode',
  'reconfigure',
  'set', //
  'append', //
]

export const OPTIONS = [
  'items',
  'ranges',
  'scale',
  'x',
  'y',
  'color',
  'order',
  'size',
  'order',
  'data',
  'dataset',
  'value',
]

// index = 0，默认参数
export const ACTION_TO_OPTIONS = {
  select: ['items', 'ranges'],
  filter: ['items'],
  navigate: ['scale'],
  encode: ['x', 'y', 'color', 'size', 'color'],
  reconfigure: ['order'],
  set: ['data', 'dataset', 'value'],
  append: ['data', 'dataset'],
}

// export const ACTIONS = Object.keys(ACTION_TO_OPTIONS)
// export const OPTIONS = _.uniq(_.flatten(Object.values(ACTION_TO_OPTIONS)))
