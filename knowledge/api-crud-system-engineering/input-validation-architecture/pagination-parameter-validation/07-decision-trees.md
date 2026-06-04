# Decision Trees: Pagination Parameter Validation

## Tree 1: Pagination Type Determination

```
What pagination strategy does this endpoint use?
├── Offset pagination (page + per_page) → Validate page (integer, min:1), per_page (integer, min:1, max).
├── Cursor pagination (cursor parameter) → Validate cursor format (opaque token regex). No page/per_page.
├── Keyset pagination (sorting key) → Validate the cursor/next_key format. Validate sort direction.
├── Simple pagination (previous/next only) → Validate per_page (integer, min:1, max).
└── No pagination (all results) → No pagination parameters needed. Consider adding pagination if dataset grows.
```

## Tree 2: Per-Page Maximum Setting

```
What is the typical row size for this resource?
├── Small rows (ID, name, status — < 100 bytes each) → Max 100-200 per page. Higher throughput.
├── Medium rows (with descriptions, metadata — 100-500 bytes) → Max 50-100 per page.
├── Large rows (with full JSON, BLOBs — 500+ bytes) → Max 15-25 per page. Prevent memory pressure.
├── Audit logs (many columns, long text) → Max 25-50 per page. Queries are expensive.
└── Mixed (some rows large, some small) → Default 15. Override maxPerPage() per resource type.
```

## Tree 3: Default Value Injection

```
Do pagination parameters have sensible defaults?
├── YES, page defaults to 1 → Inject in prepareForValidation(): `page' => (int) $input('page', 1)`.
├── YES, per_page defaults to 15 → Inject in prepareForValidation(): `per_page' => clamp($input('per_page', 15))`.
├── NO, but client should not be forced to provide them → Inject defaults in prepareForValidation(). Use trait.
├── NO, every client must explicitly specify → Remove defaults. Make parameters required in rules().
└── YES, but different tiers have different defaults → Role-aware default injection. Admin gets higher per_page default.
```

## Tree 4: Sort Field Validation

```
Does the endpoint support sorting?
├── YES, sort by specific columns → Validate against allowlist. Never pass user input to orderBy() directly.
├── YES, sort by any column (admin only) → Dynamic validation against schema columns. Whitelist approach still safer.
├── YES, multi-column sort (sort=title,-created_at) → Parse and validate each field individually against allowlist.
├── YES, with direction prefix (+ or -) → Parse prefix as sort direction. Validate field name separately.
└── NO, fixed sort order → No sort parameter needed. Server determines sort order.
```

## Tree 5: Role-Based Pagination Limits

```
Do different user roles need different pagination limits?
├── YES, admin exports need higher limits → Role-aware maxPerPage(). Admin = 500, user = 100.
├── YES, internal API (between services) → Higher limits. Internal network = less concern.
├── YES, public API with free and paid tiers → Tier-aware limits. Paid = higher per_page.
├── NO, all users get the same limits → Single maxPerPage() for all. Simpler.
└── NO, pagination is fixed server-side → No client-facing pagination params. Server controls completely.
```
