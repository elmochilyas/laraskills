# Metadata

Domain: Application Architecture Patterns
Subdomain: Service Layer Pattern
Knowledge Unit: Action class naming: verb-noun commands
Knowledge Unit ID: SLP-08
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Overview

Action classes follow a strict verb-noun naming convention. `CreateUser`, `ProcessPayment`, `GenerateInvoice`, `CancelSubscription`. The verb is the operation (Create, Process, Generate, Cancel). The noun is the target (User, Payment, Invoice, Subscription). This naming is self-documenting: a directory of actions reads like a list of business operations.

---

# Core Concepts

- **Verb-Noun**: `CreateUserAction`, `ProcessPaymentAction`, `GenerateInvoiceAction`.
- **Action suffix**: Optional but recommended to distinguish from models.
- **Directory as menu**: `app/Actions/` reads like a business operations menu.

---

# When To Use

- Always for action classes. Consistency matters more than the specific convention choice.

---

# When NOT To Use

- Using actions without the Action suffix (acceptable if consistent).

---

# Best Practices

- **Use the Action suffix to reduce naming conflicts.** WHY: `app/Models/User.php` and `app/Actions/User.php` collide. `UserAction` suffix prevents this.
- **Group actions by domain subdirectory.** WHY: `app/Actions/Billing/CreateInvoiceAction.php` — actions are organized by domain, not flat.
- **Establish a controlled verb vocabulary.** WHY: `Create` vs `Make` vs `Generate` confusion. Document which verbs to use. Common: Create, Update, Delete, Process, Send, Generate, Cancel, Approve, Reject, Archive.
- **Avoid action names that are too long.** WHY: `ProcessAndNotifyPaymentAction.php` — the action is doing too much. Split into separate actions orchestrated by a service.

---

# Architecture Guidelines

- Verb-Noun + Action suffix: `CreateUserAction`, `ProcessPaymentAction`.
- Use `handle()` or `execute()` as the public method — both are widely used. Pick one and be consistent.
- Domains as subdirectories: `app/Actions/Billing/`, `app/Actions/Auth/`, etc.

---

# Performance Considerations

- No impact from naming conventions.

---

# Security Considerations

- No implications.

---

# Common Mistakes

1. **Generic action names:** `ProcessAction`, `HandleAction`. Cause: lazy naming. Consequence: doesn't communicate what the action does.

2. **Inconsistent verb choices:** `MakeOrder`, `CreateOrder`, `GenerateOrder` for the same operation. Cause: no controlled vocabulary. Consequence: confusion. Better: document approved verbs.

3. **Too-specific names:** `CreateUserWithWorkspaceAndSendWelcomeEmailAction`. Cause: action doing too much. Consequence: violates single responsibility. Better: split into separate actions orchestrated by a service.

---

# Anti-Patterns

- **Action name collision**: Two actions with same name in different domains. Prefix with domain if needed.
- **Verb inconsistency**: Half the team uses Create, other half uses Make/Generate.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| SLP-02 Action classes | SLP-07 Service naming | COS-08 Naming conventions |
| COS-04 Namespace conventions | SLP-10 Decision criteria | AEG-07 Team convention docs |

---

# AI Agent Notes

- Generate action classes with Verb-Noun naming.
- Use Action suffix by default.
- Group actions by domain subdirectory.
- Use consistent verbs.

---

# Verification

- [ ] All actions use Verb-Noun naming
- [ ] Action suffix is used consistently
- [ ] Actions grouped by domain subdirectory
- [ ] Controlled verb vocabulary is documented and followed
- [ ] No action name is unreasonably long
