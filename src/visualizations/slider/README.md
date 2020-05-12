# Slider

A slider UI component.

## Reactive Properties

| property | description                 | method | target | callback      | internal listener                |
| -------- | --------------------------- | ------ | ------ | ------------- | -------------------------------- |
| max      | the max value of the slider | -      | -      | `_onMinSet`   | -                                |
| min      | the min value of the slider | -      | -      | `_onMaxSet`   | -                                |
| value    | the value of the slider     | set    | value  | `_onValueSet` | `addEventListener('input', ...)` |
