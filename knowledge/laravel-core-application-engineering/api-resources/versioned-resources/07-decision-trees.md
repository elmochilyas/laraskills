# Decision Trees — Versioned Resources

---

## Decision: Copy-and-Modify vs Inheritance for Versioned Resources

---

## Decision Context

When creating a new API version, should the resource inherit from the previous version (extend) or be a fully independent copy?

---

## Decision Criteria

* **Change magnitude:** Is the change additive (new fields only) or structural (field renames, removals, type changes)?
* **Risk tolerance:** Can changes to the parent version accidentally affect the derived version?
* **Maintenance burden:** How many versions will be maintained concurrently?

---

## Decision Tree

Need to create a new version of a resource?

↓

Does the new version have structural changes (field renames, removals, type changes, restructuring)?

YES → Use copy-and-modify — fully independent copy, zero risk of cross-version breakage

NO → Is the change purely additive (new fields alongside existing ones without modification)?

    YES → Is this the first version transition (no previous inheritance chain)?

        YES → Inheritance is acceptable — extend the previous version, add new fields via `parent::toArray() + [...]`

        NO → Is there already existing inheritance (V3 extends V2 extends V1)?

            YES → Use copy-and-modify — deep inheritance chains are untraceable and fragile

            NO → Inheritance is acceptable — cap at 2 levels

---

## Rationale

Copy-and-modify eliminates all coupling between versions — changes to V2 can never affect V1 because they are completely independent files. The cost is code duplication. Inheritance reduces duplication but creates coupling — a bug fix in the base can change the output of all derived versions. The rule is: structural changes → copy-and-modify; additive changes → inheritance (capped at 2 levels).

---

## Recommended Default

**Default:** Use copy-and-modify for public APIs; use inheritance (max 2 levels) for internal APIs with additive-only changes
**Reason:** Public APIs require absolute version isolation; internal APIs benefit from reduced duplication with acceptable risk

---

## Risks Of Wrong Choice

Inheriting V2 from V1 and then fixing a bug in V1's `toArray()` (adding a new field) accidentally adds that field to V2 responses. Copy-and-modify entirely prevents this. Conversely, copy-and-modify every version for minor changes creates massive duplication.

---

## Related Rules

* Rule: Prefer Copy-and-Modify for Major Versions, Inheritance for Minor (versioned-resources/05-rules.md)
* Rule: Cap Inheritance at 2 Levels Maximum (versioned-resources/05-rules.md)

---

## Related Skills

* Create a Versioned API Resource (versioned-resources/06-skills.md)
* Resource Organization (resource-organization/06-skills.md)

---

---

## Decision: URL-Based vs Header-Based API Versioning

---

## Decision Context

Should the API version be indicated in the URL path (`/api/v1/users`) or in the request headers (`Accept: application/vnd.api+json; version=1`)?

---

## Decision Criteria

* **Discoverability:** Can developers easily test and explore versions?
* **Caching:** Does the version need to be part of the cache key?
* **Framework support:** Which approach is better supported by the routing layer?

---

## Decision Tree

Need to decide how clients specify the API version?

↓

Is the API public with many external consumers?

YES → Use URL-based versioning — `/api/v1/users` — most discoverable, easiest to test and document

NO → Is the API consumed by mobile clients where URL cleanliness is important?

    YES → Consider header-based versioning — cleaner URLs, but harder to test and debug

    NO → Use URL-based versioning — simpler routing, better documentation, explicit contract

---

## Rationale

URL-based versioning is more discoverable, testable, and documentable. A developer can enter `/api/v1/users` in a browser or curl and immediately know which version they are hitting. Header-based versioning requires custom headers, special client configuration, and is harder to document and test. The only advantage of header-based is cleaner URLs, which matters little for most APIs.

---

## Recommended Default

**Default:** Use URL-based versioning (`/api/v1/...`) for all APIs
**Reason:** Discoverable, testable, documentable; both frameworks and clients support URL-based versioning natively

---

## Risks Of Wrong Choice

Header-based versioning makes API exploration cumbersome — developers need special tools to set custom headers. Documentation is harder because URLs cannot be directly shared. URL-based versioning "pollutes" the URL path but these are minor aesthetic concerns compared to the usability benefits.

---

## Related Rules

* Rule: Version Controllers and Resources Together (versioned-resources/05-rules.md)
* Rule: Never Use Conditional Version Logic Inside a Single Resource (versioned-resources/05-rules.md)

---

## Related Skills

* Create a Versioned API Resource (versioned-resources/06-skills.md)
* Resource Organization (resource-organization/06-skills.md)

---

---

## Decision: Version Count Limit — How Many Concurrent Versions to Support

---

## Decision Context

How many API versions should the team maintain concurrently before sunsetting old ones?

---

## Decision Criteria

* **Client migration time:** How long do clients typically take to upgrade?
* **Team capacity:** How many versions can the team realistically maintain?
* **Contractual obligations:** Are there SLA commitments for specific version lifespans?

---

## Decision Tree

Need to decide how many versions to support concurrently?

↓

Are there contractual SLAs requiring specific version lifespans?

YES → Adhere to the contract — but limit to a maximum of 5 concurrent versions

NO → Support the current version + 2 previous versions (max 3 concurrent)

    ↓

Are clients upgrading quickly (< 6 months)?

    YES → Reduce to current + 1 previous (max 2 concurrent)

    NO → Keep 3 concurrent — current + 2 previous gives clients 1-2 years to migrate

---

## Rationale

Each supported version adds maintenance burden: security backports, version-specific tests, client support, and infrastructure. Three concurrent versions is the sweet spot — it gives clients a reasonable migration window (1-2 years per version) while keeping the maintenance burden manageable. More than 3 versions requires significant team investment.

---

## Recommended Default

**Default:** Support current + 2 previous versions (max 3 concurrent); sunset older versions on a documented schedule
**Reason:** Balances client migration needs with team maintenance capacity; a clear sunset policy prevents indefinite version support

---

## Risks Of Wrong Choice

Supporting 5+ versions indefinitely creates unsustainable maintenance. Each version needs security patches, test suites, and infrastructure. The team spends more time maintaining old versions than building new features. Conversely, sunsetting versions too aggressively (1 version, 6-month window) frustrates clients unable to migrate quickly.

---

## Related Rules

* Rule: Set a Sunset Policy with Maximum 3 Concurrent Versions (versioned-resources/05-rules.md)
* Rule: Use Deprecation Headers on Old Versions (versioned-resources/05-rules.md)

---

## Related Skills

* Create a Versioned API Resource (versioned-resources/06-skills.md)
* Resource Testing (resource-testing/06-skills.md)
