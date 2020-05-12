# Scatterplot

A simple scatterplot visualization for demonstrating coordination.

> Note: has vue inside 🤦‍♀️

## Reactive Properties

| property     | description                             | method   | target | callback                | internal listener               |
| ------------ | --------------------------------------- | -------- | ------ | ----------------------- | ------------------------------- |
| data         | the data items                          | set      | data   | `_onDataChange`         | `this.vm.$on('data', ...)`      |
| x            | the data attribute encoded by x channel | encode   | x      | `_onXChange`            | -                               |
| y            | the data attribute encoded by y channel | encode   | y      | `_onYChange`            | -                               |
| scale        | the value range of x and y attributes   | navigate | -      | `_onScaleChange`        | `this.vm.$on('scale', ...)`     |
| selection    | the selected items                      | select   | items  | `_onSelectionChange`    | `this.vm.$on('selection', ...)` |
| size         | the size of the circle                  | encode   | size   | `_onSizeChange`         | -                               |
| color        | the color of the circle                 | encode   | color  | `_onColorChange`        | -                               |
| filteredData | the filtered data items                 | filter   | items  | `_onFilteredDataChange` | -                               |
