# Decision Trees: Sparse Field Selection

## Tree 1: Should You Support Sparse Fieldsets?

```
How many fields does this resource expose?
├── 1-5 fields → Not needed. Always return all fields. Overhead > benefit.
├── 5-15 fields → Consider for mobile/bandwidth-constrained consumers.
├── 15+ fields → Implement. Significant bandwidth savings for most consumers.
└── Variable (some need 2 fields, others need 20) → Implement. High-value optimization.
```

## Tree 2: Parameter Format

```
What API specification does your API follow?
├── JSON:API (spec-compliant) → Use `fields[TYPE]=field1,field2` format. Required by spec.
├── Custom REST with single resource → Use `fields=field1,field2` for simplicity.
├── Custom REST with multiple resources → Use `fields[resource]=field1,field2` per resource.
└── GraphQL → Not applicable. GraphQL has built-in field selection.
```

## Tree 3: Allowlist vs Open Selection

```
Are all resource fields safe to expose?
├── YES, all fields are public → Allowlist of commonly-needed fields. Reject unknown fields.
├── NO, some fields are sensitive → Strict allowlist excluding sensitive fields. Never expose them.
├── NO, depends on user role → Role-based allowlist. Admin can select more fields.
└── NO, some fields are expensive to compute → Allowlist excluding expensive computed fields.
```

## Tree 4: Default Behavior

```
What happens when no fields parameter is provided?
├── Most consumers want all fields → Return all allowed fields by default.
├── Most consumers want minimal data → Return minimal set (id, name). Require opt-in for full.
├── Consumers vary widely → Return all allowed fields. Sparse fieldsets are opt-in reduction.
└── Mobile consumers dominate → Return minimal set by default. Full set opt-in via fields=all.
```

## Tree 5: Database-Level Optimization

```
Is the API response large enough that query optimization is needed too?
├── YES, response is large AND query is slow → Select only requested columns at DB level too.
├── YES, response is large but query is fast → Filter at resource level only. DB optimization not needed.
├── NO, response is small → Filter at resource level only. Keep queries simple.
└── NO, but DB columns are wide (TEXT/BLOB) → Select only needed columns at DB level regardless.
```
