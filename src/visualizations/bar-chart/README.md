# Histogram

A simple histogram visualization for demonstrating coordination.

> Note: has vue inside 🤦‍♀️

## Reactive Properties

| property       | description                             | method | target | callback             | internal listener               |
| -------------- | --------------------------------------- | ------ | ------ | -------------------- | ------------------------------- |
| data           | the data items                          | set    | data   | `_onDataChange`      | `this.vm.$on('data', ...)`      |
| x              | the data attribute encoded by x channel | encode | x      | `_onXChange`         | -                               |
| y              | the data attribute encoded by y channel | encode | y      | `_onYChange`         | -                               |
| selection      | the selected items                      | select | items  | `_onSelectionChange` | `this.vm.$on('selection', ...)` |
| count          | how many lines on x                     | encode | count  |                      | -                               |
| color          | the color of the circle                 | encode | color  |                      | -                               |
| selectionColor | the filtered data items                 | encode | color  |                      | -                               |
