module.exports = {
  'env': {
    'browser': true,
    'es6': true,
    'node': true,
  },
  'plugins': ['prettier'],
  'extends': ['eslint:recommended', 'plugin:prettier/recommended'],
  'globals': {
    'Atomics': 'readonly',
    'SharedArrayBuffer': 'readonly',
  },
  'parserOptions': {
    'ecmaVersion': 2018,
    'sourceType': 'module',
  },
  'ignorePatterns': ['node_modules/', 'dist/'],
}
