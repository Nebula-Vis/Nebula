# LineUp

Incorporate `lineupjs`.

## Reactive Properties

| property     | description              | method      | target | callback             | internal listener          |
| ------------ | ------------------------ | ----------- | ------ | -------------------- | -------------------------- |
| data         | the data items           | set         | data   | `_onDataSet`         | -                          |
| selection    | the selected items       | select      | items  | `_onSelectionSet`    | `_addSelectionListener`    |
| order        | the order of the columns | reconfigure | order  | `_onOrderSet`        | `_addOrderListener`        |
| filteredData | the filtered data items  | filter      | items  | `_onFilteredDataSet` | `_addFilteredDataListener` |
