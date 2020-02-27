# Coordinations

## Coordination Object

| Properties | Type | Description |
| --- | --- | --- |
| data | `Array<Object>` | **Required**. Shared data definition (supposing each visualization property could bind multiple data). |
| transformations | `Array<Object>` | Transformations between data. |

## Data Object

| Properties | Type | Description |
| --- | --- | --- |
| name | `String` | **Required**. Data name. |
| properties | `Array<String>` | **Required**. Bound visual properties (two-way binding). |

## Transformation Object
| Properties | Type | Description |
| --- | --- | --- |
| name | `String` | **Required**. Transformations name. |
| input | `Array|Object` | **Required**. Input data (2 specification methods). |
| output | `Array|Object` | **Required**. Output data (2 specification methods). |

## Example

```json
{
	"data": [
		{ "name": "d1", "properties": ["scatterplot1.selection"] },
		{ "name": "d2", "properties": ["scatterplot2.selection"] },
		{ "name": "d3", "properties": ["scatterplot1.selection", "scatterplot2.selection"] }
	],
	"transformations": [
		{
			"name": "intersect",
			"input": ["d1", "d2"],
			"output": { "intersection": "d3" }
		}
	]
}
```
