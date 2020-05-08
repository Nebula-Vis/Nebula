# AreaChart

A simple tree-map visualization for hierarchy inspection.

## Reactive Properties

| property  | description                             | method   | target   | callback             | internal listener               |
| --------- | --------------------------------------- | -------- | -------- | -------------------- | ------------------------------- |
| data      | the data items                          | set      | data     | `_onDataChange`      | rerender                        |
| selection | the selected data items                 | select   | subtree  | `_onSelectionChange` | leaf action                     |
