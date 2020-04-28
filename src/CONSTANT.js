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
  'subtree', // for sub tree selection
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
  'name',
  'value',

  'sort',
  'innerRadius',
  'aggregate',
  'count',
  'label',
  'bottomEdge',
  'style',
  'type',
  'aggregate',
]

// index = 0，默认参数
export const ACTION_TO_OPTIONS = {
  select: ['items', 'ranges', 'subtree'],
  filter: ['items'],
  navigate: ['scale'],
  encode: [
    'x',
    'y',

    'color',
    'size',
    'name',
    'value',
    'sort',
    'innerRadius',
    'aggregate',
    'count',
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
