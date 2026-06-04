# Decision Trees — Domain-Specific Error Codes

## Tree 1: Code Specificity Level

**Decision Context**: Determining how specific an error code should be — generic vs domain-specific vs operation-specific.

**Decision Criteria**:
- Client actionability (can the client do something different based on this code?)
- Number of similar error scenarios
- Error aggregation needs in dashboards

**Decision Tree**:
```
Can the client take a different action based on this specific error code vs a generic one?
├── YES → Create a specific error code — client branches on it (e.g., TOKEN_EXPIRED vs TOKEN_INVALID)
└── NO → Is this error distinguished by an existing code + context combination?
    ├── YES → Use an existing generic code (e.g., RESOURCE.NOT_FOUND) with detail distinguishing the resource
    └── NO → Would aggregating this error separately in the dashboard be useful?
        ├── YES → Create a specific error code
        └── NO → Use a generic code — excessive granularity creates unmaintainable code catalog
```

**Rationale**: Error codes should be granular enough for client branching but not so granular that the catalog becomes unmanageable (target 20-50 codes).

**Recommended Default**: One error code per client-actionable distinction. Combine codes when the only difference is the resource value (use detail for that).

**Risks**: Too many codes create an unmanageable catalog. Too few codes force clients to parse message strings.

---

## Tree 2: Backward Compatibility Decision

**Decision Context**: Whether to deprecate or repurpose an existing error code when its meaning needs to change.

**Decision Criteria**:
- Code age and consumer base
- Number of consumers switching on this code
- Suitable replacement code availability

**Decision Tree**:
```
Has the error code been published and is it consumed by external clients?
├── YES → Never repurpose — create a new code with a different name
│   Deprecate the old code: mark as @deprecated in registry, keep the constant
└── NO → Is the code used only internally?
    ├── YES → Can its meaning be safely updated without breaking internal consumers?
    │   ├── YES → Update the code's meaning and documentation
    │   └── NO → Create a new code; update all internal consumers
    └── NO → Create a new code — uncertain consumer base means deprecation is safer
```

**Rationale**: Once published, error codes are part of the API contract. Changing meaning silently breaks clients that switch on the code.

**Recommended Default**: Deprecate old code, create new code. Never repurpose.

**Risks**: Repurposing code silently breaks client logic. Creating too many deprecated codes clutters the registry.
