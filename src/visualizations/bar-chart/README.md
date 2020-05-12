# BarChart

A simple barchart visualization for demonstrating coordination.

> Note: has vue inside 🤦‍♀️

## Reactive Properties

| Property  | Type | Description | Method | Target |
| -------------- | -------------- | --------------------------------------- | ------ | ------ |
| data  | `string` |  The data name. **Note**: it receives data value array in visualization implementation. | set | data |
| x | `string` | The data field encoded by the x channel. **Default**: the first quantitative attribute's name of the data. | encode | x |
| y | `string` | The data field encoded by the y channel. **Default**: the second quantitative attribute's name of the data. | encode | y |
| count | `number` | The number of the bar. **Default**: `5`. | encode | count |
| aggregate | `string` | The aggregate method to deal data in each part. **Default**: `count`. | encode | aggregate |
| selection | `Array` | The collection of selected data items. **Default**: all items of the data. | select | items |
| selectedXRange | `Object<string, number[]>` | The range of x that is selected. **Default**: `{}`. | select | ranges |
| xRange | `Array` | The range of x that displaying. **Default**: `[]`. | navigate | ranges |
| bottomEdge | `string` | Orientation of bottom edge. **Default**: `bottom`. | - | - |
| margin | `Object<string, number>` | The margins around bars. **Default**: `{top: 20, right: 20, bottom: 35, left: 30, between: 1}`. | - | - |
| isDisplay | `boolean` | Axis display or not. **Default**: `true`. | - | - |
