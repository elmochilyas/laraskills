# Metadata

**Domain:** Testing & Reliability Engineering
**Subdomain:** Snapshot Testing
**Knowledge Unit:** Snapshot Testing with Spatie
**Generated:** 2026-06-03

---

# Decision Inventory

1. Snapshot vs explicit assertions
2. JSON driver vs text driver selection
3. Snapshot creation in CI vs local
4. Stable vs frequently-changing output for snapshots

---

# Architecture-Level Decision Trees

---

## Decision Name: Snapshot vs Explicit Assertions

---

## Decision Context

Choose between using a snapshot assertion or writing explicit value assertions for output verification.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Output has many fields (>10) where each is stable but individually asserting is tedious?
↓
YES → Use snapshot for broad coverage + explicit assertions for critical values
NO → Continue

↓
Output changes frequently (every PR)?
↓
YES → Use explicit assertions (snapshot changes become noise)
NO → Output has critical values that must never change?
↓
YES → Use explicit assertions for those values + optional snapshot for structure
NO → Snapshot alone is sufficient

---

## Rationale

Snapshots detect change but not correctness. A snapshot test passes even if output changes to another incorrect value. Explicit assertions pin critical values (status codes, error messages, key data).

---

## Recommended Default

**Default:** Snapshot + explicit critical-value assertions together
**Reason:** Broad regression detection with pinned correctness guarantees.

---

## Risks Of Wrong Choice

Snapshots alone miss incorrect-but-changed output. Explicit-only assertions miss regressions in unasserted fields.

---

## Related Rules

Rule 1: Never use snapshots as the only assertion mechanism

---

## Related Skills

Implement Snapshot Testing

---

## Decision Name: JSON Driver vs Text Driver Selection

---

## Decision Context

Choose the correct snapshot driver for the output type being tested.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Output is JSON (API response, serialized data)?
↓
YES → Use `assertMatchesJsonSnapshot()` (normalizes key order, formatting)
NO → Output is HTML (Blade views, rendered components)?
↓
YES → Use `assertMatchesHtmlSnapshot()` (normalizes attribute order, whitespace)
NO → Output is plain text?
↓
YES → Use `assertMatchesSnapshot()` (text driver)
NO → Output is binary/image?
↓
Use `assertMatchesFileSnapshot()` or `assertMatchesImageSnapshot()`

---

## Rationale

The JSON driver normalizes key ordering and formatting before comparison. The text driver is sensitive to whitespace and key order, causing false failures on trivial formatting differences.

---

## Recommended Default

**Default:** JSON driver for structured data; HTML driver for views; text for strings
**Reason:** Each driver normalizes its output type appropriately, preventing false failures.

---

## Risks Of Wrong Choice

Text driver for JSON causes false failures on key order changes. JSON driver for HTML may not catch structural changes.

---

## Related Rules

Rule 3: Use JSON driver for JSON output, not text driver

---

## Related Skills

Implement Snapshot Testing

---

## Decision Name: Snapshot Creation in CI vs Local

---

## Decision Context

Choose where and when snapshot files should be created and updated.

---

## Decision Criteria

* security
* maintainability

---

## Decision Tree

Environment is CI?
↓
YES → Always set `CREATE_SNAPSHOTS=false` — snapshots must exist already
NO → Environment is local development?
↓
YES → Create/update snapshots locally when output intentionally changes

↓
Snapshot needs updating due to intentional change?
↓
Locally: `CREATE_SNAPSHOTS=true php artisan test --filter=TestName`
Review: `git diff tests/.pest/snapshots/`
Commit: snapshots with the code change

---

## Rationale

CI-created snapshots don't represent actual expected output — they represent whatever output the code happened to produce in CI. This causes snapshot drift where tests pass in CI but locally the output differs.

---

## Recommended Default

**Default:** Create snapshots locally; commit with code; CI verifies (doesn't create)
**Reason:** Ensures snapshots represent intentional, reviewed expected output.

---

## Risks Of Wrong Choice

CI creates snapshots: snapshot drift, tests pass in CI but fail locally, regression detection lost.

---

## Related Rules

Rule 2: Always set `CREATE_SNAPSHOTS=false` in CI

---

## Related Skills

Implement Snapshot Testing
