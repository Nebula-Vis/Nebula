# Visualizations

## Visualization Object

| Properties | Type | Description |
| --- | --- | --- |
| id | `String` | **Required**. Non-repeatable. |
| container | `String` | **Required**. Non-repeatable. Layout id. |
| visualization | `String` | **Required**. Visual components, including visualizations and control widgets. |
| data | `String|null` | Data name. |
| selection | `-` | |
| encoding | `Object` | Depending on the visualization field. |

## Example

```json
{
  "id": "vis1",
  "container": "xxx",
  "visualization": "scatterplot",
  "data": "houses1",
  "encoding": {
    "x": "price"
  }
}
```
