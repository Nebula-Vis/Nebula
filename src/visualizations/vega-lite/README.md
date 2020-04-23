# Vega-Lite

Incorporate some functionalites of vega-lite.

> Note: get internal update from vega-lite is quite tricky 🙂

## Reactive Properties

| property                       | description                   | method | target       | callback                       | internal listener                               |
| ------------------------------ | ----------------------------- | ------ | ------------ | ------------------------------ | ----------------------------------------------- |
| data                           | the data items                | set    | data         | `_onDataSet`                   | -                                               |
| \`selection\${name}\` | the named vega-lite selection | select | items/ranges | `` `_onSelection${name}Set` `` | ``this.view.addDataListener(`${name}_store`, ...)`` |
