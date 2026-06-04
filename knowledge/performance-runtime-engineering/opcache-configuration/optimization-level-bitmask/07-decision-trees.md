# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** Optimization Level Bitmask
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Whether to change optimization_level from default | Configuration | Debug |
| 2 | How to debug optimization-related bugs | Debug | Analyze |

---

# Architecture-Level Decision Trees

---

## Decision: Whether to Change optimization_level

---

## Decision Context

The opcache.optimization_level bitmask controls which optimization passes OpCache applies to compiled opcodes. The default (0x7FFEBFFF) enables all standard passes.

---

## Decision Criteria

* **performance** — disabling passes reduces optimization benefit
* **architectural** — default is optimal for 99.9% of applications
* **maintainability** — only change when debugging confirmed optimization bugs

---

## Decision Tree

Is there a confirmed bug where code behaves differently with OpCache enabled vs disabled?
↓
**NO** → Keep default optimization_level (0x7FFEBFFF). Do not change.
**YES** → Proceed with bisection debugging.

---

Has the problem been isolated to OpCache optimization (not caching itself)?
↓
**NO** → Test with opcache.enable=0 first to confirm OpCache is the cause
**YES** → Perform bitmask bisection

---

What is the bisection method?
↓
1. Start with default (0x7FFEBFFF)
2. Disable half the bits (0x7FFEBFFE, 0x7FFEBFFB, etc.)
3. Test if bug reproduces
4. Repeat narrowing to identify the specific pass
5. File PHP bug report with the identified pass number

---

## Recommended Default

**Default:** Leave opcache.optimization_level at 0x7FFEBFFF in all production environments.
**Reason:** Default enables all standard optimization passes proven safe for typical applications.

---

## Risks Of Wrong Choice

* Setting to 0: eliminates significant optimization benefit
* Changing without understanding: may reduce performance or alter behavior
* No bug report filed: other users affected by same bug

---

## Related Rules

* Use Default (0x7FFEBFFF) in Production
* Bisect When Debugging Optimization Bugs

---

## Related Skills

* Optimization Level Bitmask
