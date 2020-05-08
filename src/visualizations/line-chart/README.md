# LineChart

A simple line chart visualization for demonstrating coordination.

> Note: has vue inside 🤦‍♀️

## Reactive Properties

| Property  | Type | Description | Method | Target |
| -------------- | -------------- | --------------------------------------- | ------ | ------ |
| data  | `string` |  The data name. **Note**: it receives data value array in visualization implementation. | set | data |
| x | `string` | The data field encoded by the x channel. **Default**: the first quantitative attribute's name of the data. | encode | x |
| y | `string` | The data field encoded by the y channel. **Default**: The second quantitative attribute's name of the data. | encode | y |
| detail | `string` | The data field encoded by the label channel. **Default**: The third quantitative attribute's name of the data. | encode | y |
| brushType | `string` | The type of brush, select x, select y or select area. **Default**: `xy`. | encode | type |
| selectedXRange | `Object<string, number[]>` | The range of x that is selected. **Default**: `{}`. | select | ranges |
| selection | `Array` | The collection of selected data items. **Default**: all items of the data. | select | items |
