# Input

An input UI component.

## Reactive Properties

| property | description                      | method | target | callback      | internal listener                |
| -------- | -------------------------------- | ------ | ------ | ------------- | -------------------------------- |
| value    | the value of the input           | set    | value  | `_onValueSet` | `addEventListener('keyup', ...)` |
