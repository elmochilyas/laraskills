# Phase 11.5 — Post-Hardening Real-Project Verification: Retrieval Impact

**Date:** 2026-06-10
**Purpose:** Assess whether Phase 11.4 hardening changes were reflected in ECC-assisted agent output during Run C.

---

## 1. Hardening Changes Applied (Phase 11.4)

Phase 11.4 added to the policy-management subdomain of the application-architecture-patterns domain:

| Artifact | ID | Description |
|----------|-----|-------------|
| Rule PM-R06 | `application-architecture-patterns/policies-gates/policy-management` | Controller store/update/destroy MUST call `$this->authorize()` |
| Anti-pattern AP-PM-06 | `application-architecture-patterns/policies-gates/policy-management` | Policy created but never invoked — dead authorization code |
| Checklist items | `application-architecture-patterns/policies-gates/policy-management` | "Authorization enforced on store/update/destroy" checklist entries |
| Skill PM-SK-06 | `application-architecture-patterns/policies-gates/policy-management` | Controller-authorization-binding skill |

---

## 2. Agent Behavior Changes

### 2.1 Run B (Pre-Hardening) — What Went Wrong

The Run B agent:
- Received context from `retrieve_context_bundle` or `search_ecc` for a "Laravel CRUD admin panel" task
- Read the knowledge unit for API CRUD patterns, which included instructions on creating policies
- Created `ProductPolicy` with all standard methods
- Registered the policy in `AuthServiceProvider`
- **Did NOT** call `$this->authorize()` in any controller action
- **Did NOT** apply the `AuthorizesRequests` trait to the base controller

The policy existed as dead code — functionally useless but visually present. The agent followed the "create a policy" pattern but missed the "use the policy" enforcement step.

### 2.2 Run C (Post-Hardening) — What Improved

The Run C agent:
- Received context that included the hardened policy-management KU with PM-R06 and AP-PM-06
- Created `ProductPolicy` with all standard methods
- Registered the policy in `AppServiceProvider`
- Applied `AuthorizesRequests` to the base `Controller` class
- Called `$this->authorize('create', Product::class)` in `store()`
- Called `$this->authorize('update', $product)` in `update()`
- Called `$this->authorize('delete', $product)` in `destroy()`

The authorization chain is complete: policy created → policy registered → policy enforced.

---

## 3. Rule Application Analysis

### 3.1 PM-R06 (Controller MUST call `$this->authorize()`)

| Action | Run B | Run C |
|--------|:-----:|:-----:|
| `index()` (list) | N/A (no model instance) | N/A (no model instance) |
| `show()` (view) | N/A (read-only) | N/A (read-only) |
| `store()` (create) | ❌ — missing `$this->authorize('create')` | ✅ — calls `$this->authorize('create', Product::class)` |
| `update()` (update) | ❌ — missing `$this->authorize('update')` | ✅ — calls `$this->authorize('update', $product)` |
| `destroy()` (delete) | ❌ — missing `$this->authorize('delete')` | ✅ — calls `$this->authorize('delete', $product)` |
| `restore()` (restore) | ❌ — missing `$this->authorize('restore')` | N/A (not hardened) |

Run C complies with PM-R06 for all three mutating operations.

### 3.2 AP-PM-06 (Dead Policy Detection)

Run B violates AP-PM-06: `ProductPolicy` is registered but never called. Run C does NOT violate AP-PM-06: the policy is both registered and invoked.

---

## 4. Downstream Quality Impact

The retrieval hardening had measurable downstream effects on Run C's implementation:

1. **Authorization gap closed** — The most critical finding. Pre-hardening, the ECC agent created a policy but did not enforce it. Post-hardening, the agent correctly enforces authorization.

2. **Test completeness improved** — Run C includes guest-401 tests for create/update/destroy that Run B omitted. These tests are the testing-layer analog of authorization enforcement.

3. **Controller structure aligned** — Run C's controller includes `AuthorizesRequests` trait on the base Controller, enabling `$this->authorize()` calls. Run B's controller lacked this trait.

4. **No adverse side effects** — The hardening changes did not cause over-correction. Run C did not add authorization where it wasn't needed (e.g., index/show are correctly left as authentication-only, not authorization-gated).

---

## 5. Limitations

1. **Single test case.** Only one task ("Build a Laravel 13 Products CRUD API") was tested across the three runs. Results may not generalize to all task types.

2. **Agent variability.** ECC-assisted runs use AI coding agents with inherent non-determinism. The observed differences may reflect agent chance rather than retrieval quality alone.

3. **No blind A/B test.** The post-hardening agent was not blinded to the hardening condition. A proper A/B test would randomize agents to hardened vs non-hardened retrievals.

4. **Timing gap.** Run B and Run C were generated in separate sessions. Environment, model version, and agent state may have differed.

---

## 6. Conclusion

The Phase 11.4 retrieval hardening is **correlated with improved agent output** in the post-hardening Run C. The most critical improvement — authorization enforcement — directly maps to the rule PM-R06 and anti-pattern AP-PM-06 added during hardening. While correlation does not prove causation (given the single test case and agent variability), the evidence is consistent with the hypothesis that retrieval hardening improved ECC-assisted implementation quality.
