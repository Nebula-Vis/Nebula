# Select

A select UI component.

## Reactive Properties

| property | description               | method | target | callback         | internal listener                 |
| -------- | ------------------------- | ------ | ------ | ---------------- | --------------------------------- |
| options  | the options of the select | set    | data   | `_onOptionsSet`  | -                                 |
| clicked  | the selected option       | set    | value  | `_onSelectedSet` | `addEventListener('change', ...)` |
