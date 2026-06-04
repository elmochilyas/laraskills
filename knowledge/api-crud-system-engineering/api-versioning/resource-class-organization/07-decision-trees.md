# Decision Trees — Resource Class Organization

## Tree 1: Resource Versioning Strategy

**Decision Context**: Whether to use versioned resource classes (separate per version) or shared resources with version-conditional fields.

**Decision Criteria**:
- Response shape difference scope
- Number of active versions
- Field deprecation requirements

**Decision Tree**:
```
Do versions share >70% of response fields?
├── YES → Use resource inheritance: V2 extends V1, overrides toArray() with array_merge for new/changed fields
└── NO → Do versions have significantly different response shapes?
    ├── YES → Separate resource classes per version (no inheritance) — clearer when shapes diverge
    └── NO → Are only a few fields different between versions?
        ├── YES → Inheritance with $this->when() for conditional fields and array_merge for additions
        └── NO → Separate resource classes per version
```

**Rationale**: Inheritance reduces duplication when shapes are similar. Separate classes are clearer when shapes diverge. Conditional fields add complexity that must be justified.

**Recommended Default**: Inheritance with progressive field enhancement for similar versions; separate classes for diverging versions.

**Risks**: Inheritance causes field bleed (V2 accidentally inherits V1-only deprecated field). Separate classes cause duplication when shapes are nearly identical.

---

## Tree 2: Field Deprecation in Resources

**Decision Context**: How to handle field deprecation across resource versions — removing fields from newer versions while keeping in older ones.

**Decision Criteria**:
- Field deprecation timeline
- Consumer usage patterns
- Documentation updates

**Decision Tree**:
```
Is the field being removed from the new version (V2) but kept in V1?
├── YES → V2 resource simply omits the field; V1 resource keeps it unchanged
│   Add `@deprecated` tag in OpenAPI spec for V1
│   Add deprecation warning in V1 response body if field is accessed
└── NO → Is the field being renamed between versions?
    ├── YES → V2 resource includes both old and new field names for one deprecation cycle
    │   Old field: mark as `@deprecated` in documentation
    │   New field: add normally
    └── NO → Is the field type changing between versions?
        ├── YES → New version with new type; old version frozen; document the change
        └── NO → Remove from V2, keep in V1; document
```

**Rationale**: Fields removed from V2 should remain in V1 unchanged. Renamed fields should have a transitional period where both names exist.

**Recommended Default**: Remove from new version, keep in old version. For renames, include both old and new field in V2 for one deprecation cycle.

**Risks**: Removing from V2 accidentally removes from V1 via shared code. Renamed fields without transitional period break consumers that use the old field name.
