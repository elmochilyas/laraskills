# Decision Trees: API Resource Transformation

## Tree 1: Resource Class Selection

```
What is the output shape?
├── Single model instance → JsonResource (UserResource::make($user))
├── Collection of models → ResourceCollection (UserResource::collection($users))
├── Paginated collection → ResourceCollection with pagination metadata
└── No model (dashboard, metrics) → Manual array response, not API resource
```

## Tree 2: Conditional Attribute Strategy

```
Should this attribute always appear in the response?
├── YES, always present → Include directly: 'name' => $this->name
├── YES, but only if loaded → $this->whenLoaded('relationship')
├── YES, but only under conditions → $this->when($condition, $value)
└── YES, but depends on permissions → $this->when($this->userCan('view_sensitive'), 'ssn')
```

## Tree 3: Computed Field Placement

```
Is this value derived from model data for API output only?
├── YES, formatting (date, currency, name) → Compute in resource toArray()
├── YES, but needs DB query → Compute in resource and eager-load in controller
├── YES, used by multiple resources → Extract to helper or presenter
└── NO, it's a model concern (business logic, validation) → Keep in model or service
```

## Tree 4: Relationship Inclusion Approach

```
Does the response need to include related data?
├── YES, always the same set → Directly include in resource toArray()
├── YES, varies by endpoint → Create separate resource classes per endpoint
├── YES, varies by request → Use ?include= parameter with whenLoaded()
└── NO, never include → Use whenLoaded() only, never access unloaded relations
```

## Tree 5: Resource Granularity

```
How many output variations does this model have?
├── 1-2 (list, detail) → One or two resource classes
├── 3-5 (list, detail, admin, export) → Separate resource per variant
├── Many with partial overlap → Base resource with conditional attributes
└── Different per API version → Versioned resource classes (V1\UserResource, V2\UserResource)
```
