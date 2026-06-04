# Decision Trees: Include Related Resources

## Tree 1: Should You Support Includes?

```
Do clients frequently need related data alongside this resource?
├── YES, every client needs the same related data → Always include. No param needed.
├── YES, but different clients need different relationships → Support ?include= parameter
├── SOMETIMES, for specific expensive relationships → Support ?include= with allowlist
└── NO, clients always fetch relationships separately → No include support. Simplify.
```

## Tree 2: Include Allowlist Scope

```
How many includable relationships does this resource expose?
├── 1-3 → Simple flat allowlist in the Form Request or service
├── 4-10 → Structured allowlist per resource class with categories
├── 10+ → Dedicated IncludeService or IncludeParser class
└── Dynamic (based on user role) → Role-aware allowlist with admin-level includes
```

## Tree 3: Nesting Depth

```
Do clients need nested includes (e.g., posts.comments.author)?
├── YES, one level deep (posts.comments) → 2 levels max. Implement with dot-notation parser.
├── YES, two levels deep (posts.comments.author) → 3 levels max. Implement with recursive parser.
├── NO, only top-level includes → Keep flat. Reject nested include requests.
└── NO, relationship depth is unbounded → Flat only. Prevent recursive query explosion.
```

## Tree 4: Include Resolution Strategy

```
How should included relationships be loaded?
├── Always loaded → Eager load in controller with ->with(). No client choice.
├── Client chooses → Parse from ?include=, validate against allowlist, apply to query.
├── Role-dependent → Admin gets more includes. Apply role-based allowlist.
└── Expensive to load → Cache included relationship data. Set shorter TTL.
```

## Tree 5: Authorization For Includes

```
Should all consumers have access to all includable relationships?
├── YES, all relationships are public → No authorization on includes needed.
├── NO, some relationships are role-restricted → Authorize each included relationship.
├── NO, depends on the resource instance → Check authorization per included resource.
└── NO, nested includes complicate authorization → Limit nesting to simplify auth checks.
```
