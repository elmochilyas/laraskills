# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** API Documentation
**Knowledge Unit:** Scribe Integration
**Generated:** 2026-06-03

---

# Decision Inventory

* Generation mode (extract vs call)
* Documentation hosting (static files vs dedicated service)

---

# Architecture-Level Decision Trees

---

## Generation Mode — Extract vs Call

---

## Decision Context

Should Scribe use extract mode (read @response annotations) or call mode (make real HTTP requests)? Arises when configuring Scribe generation.

---

## Decision Criteria

* accuracy — call mode captures real responses; extract mode shows static examples
* environment — call mode needs seeded database; extract mode has no dependencies
* stability — extract mode doesn't change; call mode may fail on missing data
* speed — extract mode is faster (5-15s vs 30-60s)

---

## Decision Tree

Does the API have a seeded development database with representative data?
↓
YES → Use call mode for accurate live response examples
NO → Use extract mode with manually maintained @response annotations

---

## Recommended Default

**Default:** Extract mode for most endpoints; call mode for frequently changing response structures
**Reason:** Extract mode is faster and doesn't depend on database state; call mode for endpoints where examples go stale quickly.

---

## Risks Of Wrong Choice

Call mode without seeded DB: examples missing or showing empty responses. Extract mode for changing APIs: response examples diverge from actual output.

---

## Documentation Hosting — Static Files vs Dedicated Service

---

## Decision Context

Where should generated Scribe documentation be hosted? Arises when deploying API documentation.

---

## Decision Tree

Is the documentation for external consumers?
↓
YES → Deploy static HTML to CDN or developer portal (scalable, no auth overhead)
NO → Internal documentation → Serve from Laravel's `/docs` route with auth middleware

---

## Recommended Default

**Default:** Static HTML deployed to CDN for public APIs; Laravel `/docs` route for internal APIs
**Reason:** CDN handles traffic and latency; Laravel route simplifies access control for internal docs.

---

## Risks Of Wrong Choice

Laravel route for public docs: unnecessary server load. CDN for internal docs: no access control.

---

*Related rules and skills are not available for this KU (no 05-rules.md or 06-skills.md files).*
