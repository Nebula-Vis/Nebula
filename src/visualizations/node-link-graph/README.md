# Node-Link Graph

D3 force-directed node-link graph.

## Reactive Properties

| property  | description                         | method | target | callback          | internal listener |
| --------- | ----------------------------------- | ------ | ------ | ----------------- | ----------------- |
| data      | the data containing nodes and links | set    | data   | `_onDataSet`      | -                 |
| selection | the selected nodes                  | select | items  | `_onSelectionSet` | -                 |
