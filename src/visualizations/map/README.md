# AreaChart

A simple area chart visualization for demonstrating coordination.

> Note: has vue inside 🤦‍♀️

## Reactive Properties

| property  | description                             | method   | target | callback             | internal listener               |
| --------- | --------------------------------------- | -------- | ------ | -------------------- | ------------------------------- |
| data      | the data items                          | set      | data   | `_onDataChange`      | `this.vm.$on('data', ...)`      |
| x         | the data attribute encoded by x channel | encode   | x      | `_onXChange`         | -                               |
| y         | the data attribute encoded by y channel | encode   | y      | `_onYChange`         | -                               |
| scale     | the value ranges of the x attribute     | navigate | -      | `_onScaleChange`     | `this.vm.$on('scale', ...)`     |
| selection | the selected data items                 | select   | items  | `_onSelectionChange` | `this.vm.$on('selection', ...)` |
