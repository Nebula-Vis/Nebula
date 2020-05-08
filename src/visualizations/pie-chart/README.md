# Pie Chart

A single pie chart visualization for demonstrating coordination.

>Note: has vue inside 🤦‍♀

## Reactive Properties

| property      | type   | description                                   | method    | target    | callback              | internal listener             |
| ---------     | -----  | --------------------------------------        | ----------|-----------|-------------------    |---------------------------    |
|data           |Array   |the data items                                 |set        |data       |`_onDataChange`        |`this.vm.$on('data',...)`      |
|x              |string  |the data attribute encoded by x channel (range)|encode     |x          |`_onXChange`           |-                              |
|y              |string  |the data attribute encoded by y channel (value)|encode     |y          |`_onYChange`           |-                              |
|selection      |Array   |the data items                                 |select     |items      |`_onSelectionChange`   |`this.vm.$on('selection',...)` |
