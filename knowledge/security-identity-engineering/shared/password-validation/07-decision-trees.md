# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Additional Security Concerns
**Knowledge Unit:** Password Validation Rule Objects
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Centralized Defaults vs Per-Form Rules | Password policy management strategy | maintainability, consistency |
| 2 | uncompromised() Enablement | Whether to enable HIBP breached-password check | security, latency |

---

# Architecture-Level Decision Trees

---

## Centralized Defaults vs Per-Form Rules

---

## Decision Context

Whether to define password validation policy via `Password::defaults()` in a service provider or declare rules explicitly in each Form Request.

---

## Decision Criteria

* maintainability
* consistency

---

## Decision Tree

How many password forms exist in the application?
↓
Few (1-2) → Per-form rules are manageable (but defaults are still better)
Many (3+) → Centralized defaults required (rule drift is inevitable with per-form rules)

Is a consistent password policy required across all endpoints?
↓
YES → Centralized defaults (single source of truth)
NO → Per-form rules acceptable (but risky — one form may have weaker rules)

Do admin users need stricter password rules?
↓
YES → Centralized defaults for general users + explicit overrides for admin forms
NO → Centralized defaults cover all use cases

How often does the password policy change?
↓
Frequently → Centralized defaults (one change propagates everywhere)
Rarely → Per-form rules manageable but duplicative

Is team discipline high enough to avoid rule drift?
↓
YES → Per-form rules might work temporarily (still not recommended)
NO → Centralized defaults enforce consistency regardless of developer discipline

---

## Rationale

Centralized defaults via `Password::defaults()` ensure every password validation endpoint enforces the same policy. Per-form rules inevitably drift — one developer adds a stricter rule for registration, another keeps the weaker rule for password reset, and the weakest policy becomes the attack entry point. Centralized defaults make policy changes a single-line change instead of a project-wide search-and-replace.

---

## Recommended Default

**Default:** Centralized `Password::defaults()` in `AppServiceProvider` with composition rules (mixedCase + numbers + symbols + uncompromised); admin forms override with stricter rules (min:12) when needed
**Reason:** A single source of truth for password policy prevents rule drift across endpoints. The defaults pattern is zero-effort for developers — they use `Password::defaults()` without thinking about individual rules. Admin overrides are explicit exceptions that require conscious decision.

---

## Risks Of Wrong Choice

- Per-form rules: policy drift (some forms accept weaker passwords)
- No default set: developers use `min:8` string rule without composition checks
- Overriding defaults incorrectly: stronger defaults overwritten by weaker per-form rules
- Not setting any password rules: "12345678" accepted on all forms

---

## Related Rules

- Centralize Password Rules via Password::defaults() (05-rules.md)
- Always Enable uncompromised() Password Check (05-rules.md)
- Override Defaults Only for Stricter Requirements (05-rules.md)

---

## Related Skills

- Implement Secure Password Validation Rules (06-skills.md)

---

## uncompromised() Enablement

---

## Decision Context

Whether to enable the `uncompromised()` rule that checks passwords against the Have I Been Pwned database.

---

## Decision Criteria

* security
* latency

---

## Decision Tree

Is the application handling user-facing registration or password change?
↓
YES → Enable `uncompromised()` (breached passwords are trivially guessable)
NO → Not applicable (no password entry)

What is the acceptable latency for password validation?
↓
< 200ms → May need to skip `uncompromised()` or implement caching (HIBP adds 200-500ms)
200-500ms → Acceptable for registration and password change (these are infrequent operations)
> 500ms → Acceptable — HIBP latency is negligible in context

Is the HIBP k-anonymity API accessible from the server?
↓
YES → Enable `uncompromised()` (k-anonymity preserves privacy — only first 5 chars of SHA-1 hash sent)
NO → Consider alternative: use HIBP Pwned Passwords API offline list or skip the check

Is graceful failure handling implemented?
↓
YES → Enable `uncompromised()` with graceful fallback (HIBP API outage does not block registration)
NO → Implement graceful failure first — HIBP API can be unavailable

---

## Rationale

The `uncompromised()` check is the single most effective password validation rule: no password complexity requirement prevents attackers from trying passwords that appear in known breaches. A password like "Summer2024!" passes all complexity rules but is trivially guessable if it appears in a breach. The k-anonymity protocol ensures privacy — the actual password never leaves the server. The 200-500ms latency is negligible for registration/password change forms that already take seconds to complete.

---

## Recommended Default

**Default:** Enable `uncompromised()` on all password validation rules with graceful failure callback; accept 200-500ms latency for registration and password change forms
**Reason:** A breached password is trivially guessable regardless of complexity. The HIBP database contains over 600 million known passwords. The k-anonymity protocol is privacy-preserving (only 5 chars of SHA-1 hash sent). The latency impact is minimal for infrequent operations like registration and password changes.

---

## Risks Of Wrong Choice

- Not using uncompromised(): breached passwords accepted; attackers can use credential stuffing
- uncompromised() without graceful failure: HIBP API outage blocks all user registrations
- uncompromised() on login form: unnecessary latency (login should not check breach status)
- Assuming complexity rules are sufficient: "P@ssw0rd" passes all composition rules but is breached

---

## Related Rules

- Always Enable uncompromised() Password Check (05-rules.md)
- Handle HIBP API Errors Gracefully (05-rules.md)
- Rehash Passwords on Login When Bcrypt Cost Changes (05-rules.md)

---

## Related Skills

- Implement Secure Password Validation Rules (06-skills.md)
