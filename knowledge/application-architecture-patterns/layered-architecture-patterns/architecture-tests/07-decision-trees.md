# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Layered Architecture Patterns
**Knowledge Unit:** Architecture tests to enforce layer boundaries
**Generated:** 2026-06-03

---

# Decision Inventory

* Dependency whitelist vs blacklist approach
* Import-based checks vs deep static analysis (Facade calls, helpers)
* Baseline existing violations vs strict enforcement from day one

---

# Architecture-Level Decision Trees

---

## Dependency Whitelist vs Blacklist Approach

---

## Decision Context

Whitelisting explicitly lists allowed namespaces per layer — everything else is forbidden. Blacklisting lists forbidden namespaces — everything else is allowed. Whitelisting is stricter and more maintainable.

---

## Decision Criteria

* performance considerations — both approaches have similar runtime
* architectural considerations — whitelist is stricter; blacklist is easier to set up initially
* security considerations — whitelist prevents unknown dangerous dependencies
* maintainability considerations — whitelist must be updated when architecture changes; blacklist misses new dependencies

---

## Decision Tree

Enforcement approach?
↓
Can you enumerate all allowed dependencies per layer?
YES → Use dependency whitelist — stricter and more maintainable
NO → Can you enumerate all currently forbidden dependencies?
    YES → Use dependency blacklist — easier initial setup
    NO → Is introducing violations acceptable temporarily?
        YES → Start with blacklist, move to whitelist over time
        NO → Use whitelist — requires up-front effort but is safer

---

## Rationale

Dependency whitelisting (allowing only specific namespaces) is stricter than blacklisting (forbidding specific namespaces). Whitelisting catches all violations, including those from unknown namespaces. Blacklisting requires anticipating every possible forbidden namespace.

---

## Recommended Default

**Default:** Dependency whitelist approach
**Reason:** Whitelisting is stricter and more maintainable. It catches violations from unknown namespaces that blacklists miss. The initial setup cost is offset by fewer false negatives over time.

---

## Risks Of Wrong Choice

Blacklisting misses dependencies from unexpected namespaces — a class imports `Acme\Inc\SecretService` and passes because it wasn't blacklisted. Whitelisting requires explicit updates when new dependencies are intentionally added.

---

## Related Rules

- Rule: Use Dependency Whitelist (Not Blacklist) (LAP-13/05-rules.md)
- Rule: Write Architecture Tests Before They're Needed (LAP-13/05-rules.md)

---

## Related Skills

- Write Architecture Tests for Layer Boundaries (LAP-13/06-skills.md)
- Enforce the Dependency Rule (LAP-04/06-skills.md)

---

## Import-Based Checks vs Deep Static Analysis (Facade Calls, Helpers)

---

## Decision Context

Architecture tests checking `use` statements catch most dependency violations but miss Facade calls (`DB::table()`) and helper function calls (`response()`, `validator()`). Deep static analysis (PHPStan/Psalm custom rules) catches these implicit dependencies.

---

## Decision Criteria

* performance considerations — deep analysis is slower (parses all files) than import checks
* architectural considerations — import checks miss global function calls; deep analysis catches them
* security considerations — Facade calls in Domain layer violate architectural integrity
* maintainability considerations — PHPStan rules require more configuration but provide deeper coverage

---

## Decision Tree

Analysis depth?
↓
Can violations occur through Facades or global helpers (not just imports)?
YES → Combine import checks (Pest arch tests) + deep analysis (PHPStan custom rules)
NO → Are there any Facade calls or helper functions in the codebase?
    YES → Use deep analysis — PHPStan catches these
    NO → Import-based checks (Pest arch tests) may be sufficient

---

## Rationale

Import-based architecture tests (`arch()->expect('App\Domain')->toOnlyUse([])`) catch violations via `use` statements. However, Facade calls (`\DB::table()`) and global helpers (`response()`) don't require imports. PHPStan custom rules are needed to catch these implicit dependencies.

---

## Recommended Default

**Default:** Combine Pest arch tests (import checks) + PHPStan custom rules (deep analysis)
**Reason:** Import checks catch most violations but miss Facade calls and global helpers. PHPStan custom rules provide deep analysis. Together they provide comprehensive coverage.

---

## Risks Of Wrong Choice

Import-only analysis misses Domain classes that call `\DB::table()` via Facade — the violation works at runtime but bypasses import checks. PHPStan without arch tests may be too complex to configure.

---

## Related Rules

- Rule: Combine Pest Arch Tests with PHPStan Custom Rules (LAP-13/05-rules.md)
- Rule: Run Arch Tests in CI as a Blocking Check (LAP-13/05-rules.md)

---

## Related Skills

- Write Architecture Tests for Layer Boundaries (LAP-13/06-skills.md)
- Enforce Architecture with Static Analysis Rules (AEG-03/06-skills.md)

---

## Baseline Existing Violations vs Strict Enforcement from Day One

---

## Decision Context

When introducing architecture tests to a legacy codebase, existing violations must be handled. Baselines allow CI to fail only on NEW violations. Strict enforcement from day one blocks CI immediately.

---

## Decision Criteria

* performance considerations — baseline processing adds minimal overhead
* architectural considerations — baselines enable incremental adoption; strict enforcement blocks development
* security considerations — security-critical violations should never be baselined
* maintainability considerations — baselines must be updated when old code is refactored

---

## Decision Tree

Legacy violation handling?
↓
Does existing code have architecture violations?
YES → Use baseline — allow existing violations, fail on NEW ones only
NO → Strict enforcement from day one — no baseline needed
    ↓
    Are any existing violations security-critical?
        YES → Fix immediately — do not baseline security violations
        NO → Baseline acceptable — plan incremental refactoring

---

## Rationale

Baselines enable incremental architecture adoption without blocking development. Existing violations are recorded and allowed; CI fails only when new violations are introduced. This allows teams to fix violations at their own pace while preventing regression.

---

## Recommended Default

**Default:** Baseline existing violations; enforce strictly for new code
**Reason:** Strict enforcement from day one blocks CI and creates resentment. Baselines allow incremental cleanup while preventing new violations. Remove from baseline as each violation is fixed.

---

## Risks Of Wrong Choice

No baseline blocks all development until legacy code is fixed — takes months. Baselines without cleanup plans become permanent — violations never get fixed.

---

## Related Rules

- Rule: Baseline Existing Violations When Introducing Tests to Legacy Code (LAP-13/05-rules.md)
- Rule: Run Arch Tests in CI as a Blocking Check (LAP-13/05-rules.md)

---

## Related Skills

- Write Architecture Tests for Layer Boundaries (LAP-13/06-skills.md)
- Detect and Prevent Architecture Drift (AEG-08/06-skills.md)
