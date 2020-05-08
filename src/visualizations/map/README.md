# AreaChart

A simple area chart visualization for demonstrating coordination.

> Note: has vue inside 🤦‍♀️

## Reactive Properties

| Property  | Type | Description | Method | Target |
| -------------- | -------------- | --------------------------------------- | ------ | ------ |
| data  | `string` |  The data name. **Note**: it receives data value array in visualization implementation. | set | data |
| x | `string` | The data field encoded by the x channel. **Default**: the first quantitative attribute's name of the data. | encode | x |
| y | `string` | The data field encoded by the y channel. **Default**: The second quantitative attribute's name of the data. | encode | y |
| brushType | `string` | The type of brush, select x, select y or select area. **Default**: `xy`. | encode | type |
| selectedArea | `Object<string, number[]>` | The range of x and y that is selected. **Default**: `{}`. | select | ranges |
| selection | `Array` | The collection of selected data items. **Default**: all items of the data. | select | items |
| visibleData | `Array` | The data that is visible in the map. **Default**: `[]`. | navigate | items |
| visibleRange | `Object<string, number[]>` | The data range that is visible in the map. **Default**: `{}`. | navigate | ranges |
| mapStyle | `Object<string, number | string | boolean | array>` | The data range that is visible in the map. **Default**: `{}`. | - | - |
| circleColor | `string` | The color of the circle in the map. **Default**: `#80B1D3`. | - | - |