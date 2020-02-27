# 5 Transformations

- Transformations include built-in transformations (no definition required) and user-defined transformations (require manual definition).

## 5.1 Build-in Transformations

### 5.1.1 Intersect

- Calculate the intersection of multiple sets.

#### Parameters

| Properties | Type | Description |
| --- | --- | --- |
| arrays | `Array<Array>` | **Required**. The arrays to intersect. |

#### Output

| Properties | Type | Description |
| --- | --- | --- |
| intersection | `Array` | The intersection of input arrays. |

### 5.1.2 TODOLIST

- [ ]  Union
- [ ]  Aggregate
- [ ]  Bin
- [ ]  Calculate
- [ ]  Filter

## 5.2 Custom Transformations

### Custom Transformation Object

| Properties | Type | Description |
| --- | --- | --- |
| name | `String` | **Required**. Non-repeatable. |
| url | `String` | **Required**. Send a http request to use computation api. |
| parameters | `Array` | **Required**. Parameters name and type. |
| output | `Array` | **Required**. Output name and type. |

Example

```json
{
  "name": "kmeans",
  "url": "http://localhost:8080/comp/kmeans",
  "parameters": ["arrary", "k"],
  "output": ["array"]
}
```
