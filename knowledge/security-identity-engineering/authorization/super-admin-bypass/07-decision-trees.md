# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Authorization
**Knowledge Unit:** Super-Admin Bypass (Gate::before)
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Gate::before vs Spatie Wildcard vs Policy Override | Super-admin bypass mechanism | security, maintainability |
| 2 | Super-Admin Identification Method | How to determine who is a super-admin | security, maintainability |
| 3 | Audit Trail for Super-Admin Actions | Logging bypassed authorization checks | security, audit |

---

# Architecture-Level Decision Trees

---

## Gate::before vs Spatie Wildcard vs Policy Override

---

## Decision Context

Choosing the super-admin bypass implementation: `Gate::before()`, Spatie `*` wildcard permission, or per-Policy `before()` methods.

---

## Decision Criteria

* security
* maintainability

---

## Decision Tree

Is the application using Spatie laravel-permission?
↓
YES → Do you want bypass at the Gate level (all authorization)?
    YES → Spatie wildcard permission (`*` on super-admin role) — more visible, package-integrated
    NO → Spatie wildcard is the natural choice
NO → Do you need bypass at the Gate level (covers all Gates and Policies)?
    YES → Gate::before() (highest level, most comprehensive)
    NO → Do you need bypass per-model (selective bypass)?
        YES → Policy `before()` method per model
        NO → Gate::before() (single registration, covers everything)

Do different models need different bypass rules?
↓
YES → Per-Policy `before()` methods (selective model-by-model control)
NO → Single Gate::before() or Spatie wildcard (uniform bypass)

---

## Rationale

`Gate::before()` is the highest-level bypass — it intercepts all authorization checks. Spatie's `*` wildcard permission achieves the same but within Spatie's permission system, making it more visible to developers. Per-Policy `before()` methods allow selective bypass (super-admin can delete posts but not manage billing). `Gate::before()` is the most common and straightforward pattern.

---

## Recommended Default

**Default:** `Gate::before()` with `$user->hasRole('super-admin')` for Spatie projects; `Gate::before()` with `$user->is_super_admin` for non-Spatie projects
**Reason:** `Gate::before()` is the most straightforward and covers all authorization checks with a single registration. It works with both native Gates/Policies and Spatie. The pattern is well-understood and easy to test.

---

## Risks Of Wrong Choice

- Returning `false` from `before()`: denies all non-super-admin users
- Per-Policy before() without a global bypass: missing bypass in newly added policies
- Spatie wildcard without Gate::before(): bypasses Spatie checks but not custom Gates
- No bypass at all: super-admin users must have every permission explicitly granted

---

## Related Rules

- Return true|null From Gate::before(), Never false (05-rules.md)
- Keep Gate::before() Logic Simple — Single Boolean Method Call (05-rules.md)
- Log Super-Admin Actions on Restricted Resources (05-rules.md)

---

## Related Skills

- Implement Super-Admin Bypass for Unrestricted Access (06-skills.md)
- Define Authorization Gates Using Closures (06-skills.md)

---

## Super-Admin Identification Method

---

## Decision Context

How to determine which users are super-admins — role-based, column-based, or email-based.

---

## Decision Criteria

* security
* maintainability

---

## Decision Tree

Is the application using Spatie laravel-permission?
↓
YES → Spatie role: `super-admin` role with `*` wildcard or explicit all-permissions
NO → Is this a simple application?
    YES → Boolean column: `users.is_super_admin` (simple, fast)
    NO → Is this a single-user or single-email setup?
        YES → Email-based: `config('app.super_admin_email')` (for dev/demo only)
        NO → Role-based with custom role implementation

Are there multiple super-admins?
↓
YES → Role-based or column-based (scales to multiple users)
NO → Email-based acceptable for single super-admin (but not recommended)

Does the identification need to be auditable?
↓
YES → Role-based (role assignment is a logged event)
NO → Column-based (simpler, but changes are harder to track)

---

## Rationale

Role-based super-admin identification (via Spatie) is the most maintainable — super-admin status is managed through the same role system as other permissions. Column-based (`is_super_admin`) is simpler but bypasses the role system. Email-based is appropriate only for development environments or single-user demo apps.

---

## Recommended Default

**Default:** Spatie `super-admin` role with `*` wildcard permission for Spatie projects; `users.is_super_admin` boolean column for non-Spatie projects
**Reason:** Role-based identification is consistent with the rest of the authorization system. Column-based is acceptable when not using Spatie. Email-based should never be used in production.

---

## Risks Of Wrong Choice

- Email-based in production: email change breaks super-admin access, environment variable leaks
- Column-based without audit: super-admin grants/changes not tracked
- Role-based without clear criteria: ambiguous who can assign super-admin role
- Hardcoded super-admin check: `$user->email === 'admin@example.com'` — fragile, unmaintainable

---

## Related Rules

- Keep Gate::before() Logic Simple — Single Boolean Method Call (05-rules.md)
- Log Super-Admin Actions on Restricted Resources (05-rules.md)

---

## Related Skills

- Implement Super-Admin Bypass for Unrestricted Access (06-skills.md)

---

## Audit Trail for Super-Admin Actions

---

## Decision Context

Whether and how to log actions performed by super-admin users, especially on resources they would not normally have access to.

---

## Decision Criteria

* security
* audit

---

## Decision Tree

Does the application have compliance requirements (SOC2, HIPAA, PCI DSS)?
↓
YES → Log all super-admin access to restricted resources (mandatory)
NO → Are there concerns about super-admin abuse?
    YES → Log super-admin actions on other users' resources
    NO → Light logging may be sufficient

Should the logging happen at the authorization level or action level?
↓
ACTION LEVEL → Log specific actions (delete, impersonate, access private data)
AUTHORIZATION LEVEL → Log when a super-admin bypasses a check they would normally fail

Is there an existing audit logging system (e.g., Spatie Activitylog)?
↓
YES → Integrate super-admin audit with existing system
NO → Implement simple logging for bypassed authorization checks

---

## Rationale

Super-admin bypass means normal authorization checks are skipped. Any action a super-admin performs is technically allowed, but actions on resources they wouldn't normally access should be logged. This provides accountability and detects potential abuse. The best approach is to log at the action level when a super-admin performs a sensitive action on another user's resource.

---

## Recommended Default

**Default:** Log super-admin actions on resources owned by other users; integrate with existing audit system if available
**Reason:** Super-admins performing standard actions on their own resources is expected behavior. The audit value is in tracking when a super-admin accesses or modifies resources they would not normally have access to (bypassing ownership checks).

---

## Risks Of Wrong Choice

- No logging: super-admin abuse invisible, compliance violations
- Logging everything: noise makes it hard to find important events
- Logging only authorization failures: super-admin bypass never fails, so never logged
- Logging without context: cannot determine which super-admin did what, when

---

## Related Rules

- Log Super-Admin Actions on Restricted Resources (05-rules.md)

---

## Related Skills

- Implement Super-Admin Bypass for Unrestricted Access (06-skills.md)
- Audit Logging with Spatie Activitylog (06-skills.md)
