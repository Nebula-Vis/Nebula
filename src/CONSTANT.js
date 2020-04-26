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
  'z',
  'color',
  'order',
  'size',
  'data',
  'dataset',
  'value',
  'label',
  'bottomEdge',
  'style',
  'type',
  'aggregate',
]

// index = 0，默认参数
export const ACTION_TO_OPTIONS = {
  select: ['items', 'ranges'],
  filter: ['items'],
  navigate: ['scale'],
  encode: [
    'x',
    'y',
    'z',
    'aggregate',
    'color',
    'size',
    'label',
    'bottomEdge',
    'style',
    'type',
  ],
  reconfigure: ['order'],
  set: ['data', 'dataset', 'value'],
  append: ['data', 'dataset'],
}

// export const ACTIONS = Object.keys(ACTION_TO_OPTIONS)
// export const OPTIONS = _.uniq(_.flatten(Object.values(ACTION_TO_OPTIONS)))
