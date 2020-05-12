# Button

A button UI component serves as a trigger in coordination.

## Reactive Properties

| property | description                            | method | target | callback     | internal listener                |
| -------- | -------------------------------------- | ------ | ------ | ------------ | -------------------------------- |
| text     | the text displayed on the button       | set    | value  | `_onTextSet` | -                                |
| clicked  | whether the button is clicked just now | -      | -      | -            | `addEventListener('click', ...)` |
