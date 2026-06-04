# Metadata

**Domain:** Testing & Reliability Engineering
**Subdomain:** Test Framework & Runner Infrastructure
**Knowledge Unit:** PHPUnit Configuration
**Generated:** 2026-06-03

---

# Decision Inventory

1. phpunit.xml.dist vs phpunit.xml
2. test() vs it() syntax
3. Global vs scoped trait application
4. Ci env vars vs phpunit.xml env vars

---

# Architecture-Level Decision Trees

---

## Decision Name: phpunit.xml.dist vs phpunit.xml

---

## Decision Context

Choose between committing a single phpunit.xml or using phpunit.xml.dist (committed defaults) + phpunit.xml (gitignored overrides).

---

## Decision Criteria

* maintainability
* security
* architectural

---

## Decision Tree

Team needs local config overrides?
↓
YES → Use phpunit.xml.dist (committed) + phpunit.xml (gitignored)
NO → Use single phpunit.xml (committed)

↓
Multiple developers with different environments?
↓
YES → Use .dist pattern for local overrides
NO → Single file is sufficient

---

## Rationale

The .dist pattern allows committed defaults while letting developers override settings locally without git conflicts. Single file is simpler for small teams with uniform environments.

---

## Recommended Default

**Default:** phpunit.xml.dist (committed) + phpunit.xml (gitignored)
**Reason:** Prevents accidental commits of local overrides and environment-specific secrets.

---

## Risks Of Wrong Choice

Single committed phpunit.xml forces all developers to share exact same settings, causing merge conflicts and accidental secret commits.

---

## Related Rules

Rule 6: Never store secrets in phpunit.xml or phpunit.xml.dist
Rule 8: Keep phpunit.xml as single source of truth

---

## Related Skills

Configure PHPUnit Test Suite

---

## Decision Name: test() vs it() Pest Syntax

---

## Decision Context

Choose between Pest's `test()` and `it()` syntax for a given test case.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Test body uses `$this` (TestCase)?
↓
YES → Use `test('description', fn() => ...)`
NO → Use `it('description', fn() => ...)`

↓
Test uses `@depends` annotations?
↓
YES → Use `test()` (it() closures can't receive annotation injection)
NO → Use preferred syntax based on $this access

---

## Rationale

`it()` closures do not receive the TestCase instance as `$this`. Using `$this` in an `it()` closure causes a fatal error. `test()` provides full TestCase access.

---

## Recommended Default

**Default:** Use `it()` for pure value assertions, `test()` for anything using TestCase methods
**Reason:** Eliminates "Using $this when not in object context" errors.

---

## Risks Of Wrong Choice

Using `it()` with `$this` causes fatal PHP error. Using `test()` for everything is safe but less idiomatic in Pest.

---

## Related Rules

Rule 2: Use `test()` when `$this` is needed, `it()` for pure assertions

---

## Related Skills

Configure Pest Test Suite

---

## Decision Name: phpunit.xml Env Vars vs .env.testing vs CI Secrets

---

## Decision Context

Choose where to define environment variables for the test environment.

---

## Decision Criteria

* security
* maintainability
* performance

---

## Decision Tree

Is the value a secret (password, API key)?
↓
YES → Use CI secrets or environment variables (never commit)
NO → Is it a testing-specific default not in .env?
↓
YES → Set in phpunit.xml `<php><env>` section (highest precedence)
NO → Set in .env.testing (version-controlled)

↓
Value needs to vary per developer?
↓
YES → Use .env.testing or local phpunit.xml override
NO → phpunit.xml is fine

---

## Rationale

phpunit.xml env vars have the highest precedence in Laravel. CI secrets must never be committed. .env.testing is good for shared non-sensitive overrides.

---

## Recommended Default

**Default:** Non-sensitive test defaults in phpunit.xml, secrets in CI env vars
**Reason:** phpunit.xml is version-controlled and sets reliable defaults. Secrets stay out of repo.

---

## Risks Of Wrong Choice

Committing secrets in phpunit.xml leaks credentials. Skipping APP_ENV=testing prevents .env.testing from loading.

---

## Related Rules

Rule 1: Always set APP_ENV=testing in phpunit.xml
Rule 6: Never store secrets in phpunit.xml

---

## Related Skills

Configure PHPUnit Test Suite
