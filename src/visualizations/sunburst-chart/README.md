# Sunburst Chart

A sunburst chart visualization (tree struct) for demonstrating coordination.

>Note: has vue inside 🤦‍♀

## Reactive Properties

| property      | description                                   | method    | target    | callback              | internal listener             |
| ---------     | --------------------------------------        | ----------|-----------|-------------------    |---------------------------    |
|data           |the data items                                 |set        |data       |`_onDataChange`        |`this.vm.$on('data',...)`      |
|selection      |the data items                                 |select     |items      |`_onSelectionChange`   |`this.vm.$on('selection',...)` |