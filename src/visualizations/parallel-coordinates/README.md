# AreaChart

A simple visualization for display line in parallel coordinates.

## Reactive Properties

| property  | description             | method | target | callback             | internal listener |
| --------- | ----------------------- | ------ | ------ | -------------------- | ----------------- |
| data      | the data items          | set    | data   | `_onDataChange`      | rerender          |
| color     | the stoke color         | encode | data   |                      |                   |
| selection | the selected data items | select | data   | `_onSelectionChange` |                   |
