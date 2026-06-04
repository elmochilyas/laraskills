# Decision Trees: Query Parameter Filtering

## Tree 1: Filter Syntax Selection

```
Who are the primary API consumers?
├── External developers → ?filter[field]=value with documented operators
├── Internal team → ?field=value is simpler; internal consumers understand the schema
├── Mobile apps → ?filter[field]=value with minimal operator support
└── Complex data exploration (dashboards) → JSON filter or OData-like syntax
```

## Tree 2: Filter Implementation Approach

```
How many filterable fields does the endpoint have?
├── 1-3 → Simple if/else in controller or query scope
├── 4-10 → Dedicated FilterQueryBuilder service class
├── 10+ → Individual Filter class per field with pipeline pattern
└── Dynamic (config-driven) → Configuration-based filter definition
```

## Tree 3: Filter Validation

```
What happens when an invalid filter value is provided?
├── Category field with known values → Validate against allowed list. Return 422.
├── Text search field → Accept any string. SQL injection prevented by parameterization.
├── Date field → Validate date format. Return 422 for invalid format.
└── Range field (int) → Validate numeric. Clamp to allowed range.
```
