# Phase 11.4: Authorization Enforcement Retrieval Hardening

**Report Date:** 2026-06-10
**Status:** Complete — Phase 11.4 readiness achieved.

## Summary

Phase 11.4 addressed the three gaps identified in Phase 11.3: (1) authorization enforcement gaps in knowledge unit content, (2) retrieval regression benchmark coverage, and (3) MCP error-message discoverability for non-canonical IDs. All gaps closed. Every test passes (150/150), every benchmark passes (71/71, 100%), the intelligence layer validates cleanly (0 cycles, 0 issues), and the regeneration pipeline is deterministic (identical output across 2 runs).

## Completed Work

### Knowledge Content Updates

1. **`policies-model/05-rules.md`** — Added:
   - Rule PM-R06: "Enforce Policy at Every Protected Endpoint — Every non-public controller method must call `$this->authorize()`, `$request->user()->can()`, `Gate::authorize()`, or `authorizeResource()`. Public routes exempt."

2. **`policies-model/04-standardized-knowledge.md`** — Strengthened with:
   - Clear authentication (authN) vs authorization (authZ) distinction
   - Endpoint enforcement guidance: every controller action must call `$this->authorize()`
   - New common mistakes row: "Policy registered but not enforced"
   - `#[Authorize(...)]` attribute reference (ships in Laravel 13)

3. **`policies-model/08-anti-patterns.md`** — Added `AP-PM-06` anti-pattern:
   - "Registered But Not Enforced" — policy exists but no controller calls `authorize()`
   - Includes: category (Anti-Pattern), description, detection checklist, refactoring strategy, example diff

4. **`policies-model/09-checklists.md`** — Added items:
   - "Every controller action calls `$this->authorize()`"
   - "`viewAny` defined before `view`" (added Quick Checklist + Testing Checklist sections)
   - "`before()` only handles super-admin"
   - "401 (unauthenticated) vs 403 (unauthorized) correctly distinguished"

5. **`authorization-testing/04-standardized-knowledge.md`** — Added:
   - Controller authorization test examples with explicit 401 vs 403 coverage
   - Login test with session regeneration verification

6. **`validation-rule-patterns/04-standardized-knowledge.md`** — Added:
   - Update-field pattern guidance (`sometimes` + `required` for PATCH endpoints)
   - Explanation: `sometimes` = field may be omitted, `required` = if present must not be empty
   - Regression assertion in arch test confirming the guidance exists

### Retrieval Regression Tests

7. **`tests/retrieval/fixtures/benchmark-tasks.json`** — `bench-071` updated:
   - Task: "Add authorization policies and enforce at endpoint level with authentication distinction"
   - Expected top KUs: `polic`, `authorization`, `gate`
   - Passes (71/71 benchmarks, 100%)
   - Added separate standard-mode regression test: proves bundle text contains authentication/authorization/enforcement concepts

8. **`tests/retrieval/arch-authorization-enforcement.test.mjs`** — Created as dedicated arch test covering:
   - PM-R06 rule text requires `$this->authorize()`/`Gate::authorize()` at every protected endpoint
   - Policies knowledge warns "registration ≠ enforcement"
   - Checklists require endpoint enforcement
   - Anti-patterns include "Registered But Not Enforced"
   - Intelligence JSON contains policies-model rules
   - Validation guidance contains `sometimes` + `required` update pattern
   - Standard-mode retrieval bundle contains authN vs authZ distinction, policy, and enforcement concepts

9. **`tests/retrieval/mcp.test.mjs`** — Added:
   - Test: authorization tasks route to `security-identity-engineering` domain
   - Test: Policies KU appears in the bundle
   - Test: rules present in authorization bundle
   - Test: canonical-ID round-trip (search → get → verify same ID)
   - Fixed `selectedDomains` assertion to check `d.id` (domain is an object, not a string)
   - Fixed flaky stderr race condition (replaced fixed `setTimeout(1500)` with data-driven wait for banner text)

### MCP Usability

10. **`scripts/laravel-ecc-mcp.mjs`** — Improved `get_knowledge_unit` and `get_graph_context` error messages:
    - Added `search_ecc` suggestion: "Use search_ecc to find the correct canonical ID"
    - Added canonical ID pattern hint for `get_knowledge_unit`: "Canonical IDs follow the pattern: `<domain>/<subdomain>/<knowledge-unit-name>`"

11. **`docs/mcp-tool-reference.md`** — Updated error documentation for both tools to reflect the search suggestion.

### Intelligence Layer

12. **Deterministic regeneration pipeline** — Executed `tools/rebuild-intelligence.ps1` + `tools/generation/inject-dependency-edges.ps1` twice:
    - Run 1: 429 edges, 3513 relationship edges, 0 cycles
    - Run 2: identical output — deterministic regeneration confirmed
    - Edge restoration no longer requires manual intervention

### Flaky Test Fix

13. **Fixed stderr startup-order race condition** (`mcp.test.mjs`):
    - Root cause: `await new Promise(r => setTimeout(r, 1500))` raced against async process stderr pipe
    - Fix: data-driven wait polling `stderr` buffer at 50ms intervals with 4-second safety timeout
    - No more fixed timers; test resolves as soon as the banner actually appears

## Validation

- **150/150 tests passing** (0 flakes — stderr race condition fixed)
- **71/71 benchmarks passing (100%)** — Top-KU recall: 100%, Primary accuracy: 100%
- **`validate_ecc`**: `valid: true`, 2321 KUs, 429 dependency edges, 3513 relationship edges, 0 cycles, 0 self-loops, 0 dangling edges
- **CLI smoke test**: retrieval, search, get all return correct results
- All regression tests pass (authorization enforcement, validation guidance, canonical-ID round-trip)

## Remaining Gaps

(All original gaps closed.)

1. (Pre-existing, no change) The `rebuild-intelligence.ps1` script cannot reconstruct dependency edges from scratch — the `inject-dependency-edges.ps1` script handles this from knowledge unit content. The two-step pipeline is fully functional and deterministic.
2. (Pre-existing, no change) `generate-indexes.ps1` null-key bug — not in scope; the `rebuild-intelligence.ps1` pipeline generates all indexes correctly.
3. ✅ Fixed — stderr startup-order race condition replaced with data-driven wait.
