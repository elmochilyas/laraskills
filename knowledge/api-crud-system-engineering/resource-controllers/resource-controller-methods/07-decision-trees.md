# Decision Trees: Resource Controller Methods

## Tree 1: Method Implementation

```
Which resource operation is being implemented?
├── index (GET /resources)
│   ├── With pagination → paginate(), return ResourceCollection
│   ├── Without pagination → get(), return ResourceCollection
│   └── With filters → applyFilters() before pagination
├── store (POST /resources)
│   ├── Simple creation → FormRequest + Action + 201 response
│   └── Complex creation → FormRequest + DTO + Action + Event dispatch + 201
├── show (GET /resources/{id})
│   ├── Basic resource → Route model binding + Resource
│   └── With relationships → Route model binding + load() + Resource
├── update (PUT/PATCH /resources/{id})
│   ├── Full update (PUT) → FormRequest (all fields required) + Action
│   └── Partial update (PATCH) → FormRequest (sometimes rules) + Action
└── destroy (DELETE /resources/{id})
    ├── Hard delete → Action + 204 response
    ├── Soft delete → Action (delete()) + 204
    └── Soft delete with force → if ($force) ->forceDelete() else ->delete()
```

## Tree 2: Response Selection

```
What should the response contain?
├── Created resource → Resource::make($model) with 201 + Location header
├── Updated resource → Resource::make($model) with 200
├── Deleted resource → response()->json(null, 204)
├── Resource list → Resource::collection($models) or AnonymousResourceCollection
└── Empty successful response → response()->json(null, 204) or response()->json(['data' => []])
```
