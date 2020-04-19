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

export const OPTIONS = ['items', 'ranges', 'x', 'y', 'color', 'order']

export const ACTION_TO_OPTIONS = {
  select: ['items', 'ranges'],

  'set data': ['items'],
  'replace data': ['items'],
  'append data': ['items'],
  encode: ['x', 'y', 'color'],
  reconfigure: ['order'],
}
