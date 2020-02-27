# Data

## Inline Data

| Properties | Type | Description |
| --- | --- | --- |
| name | `string` | **Required** |
| value | `-` | **Required** |

## Data from URL

| Properties | Type | Description |
| --- | --- | --- |
| name | `string` | **Required** |
| url | `string` | **Required**. Send a http get request to fetch the data. |
| format | `string` | **Required**. `"json"|"csv"` |

## Examples

```json
{
  "data": [
    {
      "name": "houses1",
      "value": [
        { "id": 1, "name": "house1", "price": 10000 },
        { "id": 2, "name": "house2", "price": 5000 },
        { "id": 3, "name": "house3", "price": 80000 }
      ]
    },
		{
			"name": "houses2",
      "url": "http://homefinder.projects.zjuidg.org/houses",
      "format": "csv"
		}
  ]
}
```
