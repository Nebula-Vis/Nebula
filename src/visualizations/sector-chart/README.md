# Sector Chart

A single sector chart visualization for demonstrating coordination.

>Note: has vue inside 🤦‍♀

## Reactive Properties

| property      | description                                   | method    | target    | callback              | internal listener             |
| ---------     | --------------------------------------        | ----------|-----------|-------------------    |---------------------------    |
|data           |the data items                                 |set        |data       |`_onDataChange`        |`this.vm.$on('data',...)`      |
|x              |the data attribute encoded by x channel(name)  |encode     |x          |`_onXChange`           |-                              |
|y              |the data attribute encoded by y channel(value) |encode     |y          |`_onYChange`           |-                              |
|sort(not done) |the data items                                 |encode     |data       |`_onSortChange`        |-                              |
|innerRadius    |the data items                                 |encode     |innerRadius|`_onInnerRadiusChange` |-                              |
|selection      |the data items                                 |select     |items      |`_onSelectionChange`   |`this.vm.$on('selection',...)` |