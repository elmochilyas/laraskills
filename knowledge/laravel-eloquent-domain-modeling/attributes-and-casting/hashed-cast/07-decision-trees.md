# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Attributes & Casting
**Knowledge Unit:** Hashed Cast
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Hashed Cast vs Encrypted Cast (One-Way vs Reversible)
* Decision 2: Hashed Cast vs Manual Hash::make() in Mutators/Controllers
* Decision 3: Column Length — Adequate vs Truncation Risk

---

# Architecture-Level Decision Trees

---

## Decision 1: Hashed Cast vs Encrypted Cast

---

## Decision Context

Choose between the `hashed` cast (one-way bcrypt) and the `encrypted` cast (reversible AES-256) for storing sensitive attribute values.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Does the original value need to be retrievable later (API calls, display, comparison)?
↓
YES → Encrypted Cast (reversible)
NO → Is the value used only for verification (passwords, tokens)?
    YES → Hashed Cast (one-way, non-reversible)
    NO → Does the application need to display or use the original value?
        YES → Encrypted Cast
        NO → Hashed Cast

---

## Rationale

Hashing is one-way and provides the strongest security for verification-only credentials. Encryption is reversible and appropriate when the application must read the original value. Using hashed for reversible data permanently destroys the information; using encrypted for passwords unnecessarily exposes plaintext.

---

## Recommended Default

**Default:** `hashed` for passwords, API tokens, recovery codes — anything that only needs verification. `encrypted` for data that must be read back (OAuth tokens, API keys used by the app).
**Reason:** Hashing is irreversible by design, providing maximum security for credentials. Encrypted data can be decrypted, which is necessary for values the application must use.

---

## Risks Of Wrong Choice

* Hashed for reversible data: permanent data loss, broken features, manual DB restoration required
* Encrypted for passwords: plaintext exposure risk if APP_KEY is compromised, compliance violations

---

## Related Rules

* Use `hashed` cast for passwords and non-reversible tokens (`05-rules.md`)
* Do not use `hashed` cast for data needing reversal (`05-rules.md`)

---

## Related Skills

* Configure Hashed Casting for Passwords and Tokens (`06-skills.md` Skill 1)

---

## Decision 2: Hashed Cast vs Manual Hash::make() in Mutators/Controllers

---

## Decision Context

Choose between the declarative `hashed` cast and manual `Hash::make()` calls scattered across mutators, controllers, and actions.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Is the attribute a password or token that should always be hashed?
↓
YES → Hashed Cast (automatic, declarative, cannot be forgotten)
NO → Does hashing only apply in specific contexts, not always?
    YES → Manual `Hash::make()` in the specific code path
    NO → Hashed Cast (automatic enforcement)

---

## Rationale

The `hashed` cast ensures every assignment is automatically hashed — no code path can accidentally store plaintext. Manual calls require discipline across every mutation point and can be missed during code reviews, leading to plaintext storage vulnerabilities.

---

## Recommended Default

**Default:** `hashed` cast for attributes that must always be hashed. Manual `Hash::make()` for context-specific hashing.
**Reason:** Declarative casts eliminate human error by enforcing hashing at the attribute level. Every assignment path is covered automatically.

---

## Risks Of Wrong Choice

* Manual hashing: one missed `Hash::make()` call creates a plaintext vulnerability
* Hashed cast for non-hashed contexts: unintentional hashing when plaintext was expected

---

## Related Rules

* Never store plaintext alongside hashed values (`05-rules.md`)
* Verify with `Hash::check`, not direct comparison (`05-rules.md`)

---

## Related Skills

* Configure Hashed Casting for Passwords and Tokens (`06-skills.md` Skill 1)

---

## Decision 3: Column Length — Adequate vs Truncation Risk

---

## Decision Context

Choose the correct database column length for an attribute using the `hashed` cast.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Is the default bcrypt algorithm being used?
↓
YES → Column length ≥ 60 characters
NO → Is Argon2 or a different algorithm configured?
    YES → Check algorithm output length; set column accordingly
    NO → Default to length ≥ 60 (bcrypt compatibility)
→ In all cases: is there uncertainty about future algorithm changes?
    YES → Use `TEXT` column (no practical length limit)
    NO → Use `string(60)` or algorithm-appropriate length

---

## Rationale

Bcrypt hashes are exactly 60 characters. Using a shorter column silently truncates the hash, making it unrecoverable and authentication impossible. The column must be at least the maximum output length of the configured hashing algorithm.

---

## Recommended Default

**Default:** `string(60)` for bcrypt. `TEXT` if algorithm may change in the future.
**Reason:** 60 characters exactly fits bcrypt output. TEXT is defensive against algorithm changes but prevents database-level length validation.

---

## Risks Of Wrong Choice

* Column too short: silent truncation, unrecoverable hashes, all authentication broken
* Excessively long column: minor storage waste, no functional impact

---

## Related Rules

* Use string column with sufficient length for hashed values (`05-rules.md`)

---

## Related Skills

* Configure Hashed Casting for Passwords and Tokens (`06-skills.md` Skill 1)
