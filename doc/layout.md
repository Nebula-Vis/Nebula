# Layout

## Layout Object

| Properties | Type | Description |
| --- | --- | --- |
| id | `String` | Map visual components to layout containers. Non-repeatable |
| width | `String|Number` | Fixed length, or how to grow or shrink to fit the available space in main axis. Only activated in root node. |
| height | `String|Number` | Fixed length, or how to grow or shrink to fit the available space in main axis. Only activated in root node. |
| length | `String|Number` | Fixed length, or how to grow or shrink to fit the available space in main axis. Only activated in non-root nodes. |
| direction | `String` | The main axis of children elements, `"row"|"column"`. |
| children | `Array<Object>` | Layout objects. |

## Example

```json
{
  "layout": {
    "width": "1000px",
    "height": "800px",
    "direction": "row",
    "children": [
      {
        "id": "timeline",
        "length": "300px"
      },
      {
        "length": 1,
        "direction": "column",
        "children": [
          {
            "id": "map",
            "length": 3
          },
          {
            "id": "lineup",
            "length": 1
          }
        ]
      }
    ]
  }
}
```
