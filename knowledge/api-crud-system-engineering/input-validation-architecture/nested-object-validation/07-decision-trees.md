# Decision Trees — Nested Object Validation

## Tree 1: Array vs Object Nested Validation

**Decision Context**: Choosing between validating an array of items vs validating nested object properties.

**Decision Criteria**:
- Whether the nested data is an indexed list vs a key-value map
- Whether each item has the same structure
- Whether items are identifiable by key

**Decision Tree**:
```
Is the nested data a list of similar items (array of users, products)?
├── YES → Use `array.*.field` syntax — validates each item uniformly
└── NO → Is the nested data a set of named properties (address, contact, settings)?
    ├── YES → Use `field.nested_field` syntax — validates specific nested properties
    └── NO → Is the nested data a mix of both (array of heterogeneous items)?
        ├── YES → Combine both: validate array structure, then validate nested object per item
        └── NO → Simplify the API — avoid deeply nested heterogeneous structures
```

**Rationale**: `array.*.field` is for uniform lists. `field.nested_field` is for specific named properties.

**Recommended Default**: `array.*.field` for collections. `field.nested_field` for structured objects.

**Risks**: Using `array.*.field` for named objects prevents key-specific rules. Using `field.nested_field` for array items misses the collection nature.

---

## Tree 2: Nested Validation Depth Limit

**Decision Context**: Setting a maximum depth for nested validation.

**Decision Criteria**:
- API design complexity
- Processing overhead
- Client capability

**Decision Tree**:
```
Does the endpoint need 3+ levels of nesting (meta.data[].user.profile)?
├── YES → Validate to 3 levels — deeper nesting is a design smell; flatten the payload
└── NO → Does the endpoint need 2 levels (data[].field)?
    ├── YES → Validate to 2 levels — common for bulk operations and nested resources
    └── NO → Validate to 1 level — flat payloads are easier to validate and process
```

**Rationale**: Deep nesting increases validation complexity and processing overhead. Flatten structured data when possible.

**Recommended Default**: 2 levels max. 3 only with explicit justification. 4+ should be redesigned.

**Risks**: Deep nesting creates complex error messages (`data.items.0.user.profile.name.0`) that are hard for clients to parse.
