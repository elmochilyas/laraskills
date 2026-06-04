# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 01-code-organization-standards
**Knowledge Unit:** Namespace conventions and directory-to-namespace mapping
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Always Declare a Namespace Matching the Directory Path followed
- [ ] Use PascalCase for All Namespace Segments followed
- [ ] Never Use Namespace Aliasing for Application Classes followed
- [ ] Flat Namespace prevented
- [ ] Deep Namespace Nesting prevented

---

# Architecture Checklist

- [ ] Always Declare a Namespace Matching the Directory Path followed
- [ ] Use PascalCase for All Namespace Segments followed
- [ ] Never Use Namespace Aliasing for Application Classes followed
- [ ] Keep Sub-Namespace Depth at 5-6 Levels Maximum followed
- [ ] Keep Root Namespace as `App\` Unless Absolutely Necessary followed

---

# Implementation Checklist

- [ ] Always Declare a Namespace Matching the Directory Path followed
- [ ] Use PascalCase for All Namespace Segments followed
- [ ] Never Use Namespace Aliasing for Application Classes followed
- [ ] Keep Sub-Namespace Depth at 5-6 Levels Maximum followed
- [ ] Keep Root Namespace as `App\` Unless Absolutely Necessary followed
- [ ] Update Both File Path and Namespace When Refactoring followed
- [ ] Never Create Directories Inside `app/` Without PHP Files followed
- [ ] Ensure Custom Namespace Prefixes Do Not Conflict with Vendor Packages followed
- [ ] Workflow step completed: **Declare namespace matching directory path.** For every PHP class file, ensure the `namespace` declaration exactly matches the directory path relative to the PSR-4 root. File `app/Services/Payment/StripeService.php` must declare `namespace App\Services\Payment;`.
- [ ] Workflow step completed: **Use PascalCase for all namespace segments.** Every namespace segment must start with an uppercase letter: `App\Http\Controllers\Api`. Mixed case causes production failures on case-sensitive Linux filesystems.
- [ ] Workflow step completed: **Keep sub-namespace depth at 5-6 levels maximum.** Limit namespace segments from the root to a manageable depth. `App\Domains\Billing\Http\Controllers\Admin` (5 segments) is acceptable; adding more makes FQCNs unwieldy.
- [ ] Workflow step completed: **Never use namespace aliasing for application classes.** Avoid `use App\Models\User as AppUser`. If two classes share the same unqualified name, restructure rather than alias.
- [ ] Workflow step completed: **Keep root namespace as `App\`.** Do not change the root namespace to `Company\Project\` unless absolutely necessary. Custom roots break all `artisan make:` commands and require stub overrides.

---

# Performance Checklist

- [ ] N+1 queries reviewed
- [ ] Caching strategy evaluated
- [ ] Expensive operations queued

---

# Security Checklist

- [ ] Authorization enforced
- [ ] Validation implemented
- [ ] Secrets protected

---

# Reliability Checklist

- [ ] Failure addressed: Namespace mismatch:
- [ ] Failure addressed: Missing namespace declaration:
- [ ] Failure addressed: Wrong root namespace in custom structures:

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Every PHP file has a `namespace` declaration matching its directory path
- [ ] `composer dump-autoload` validates all namespace mappings
- [ ] IDE navigation (Go to Definition) resolves all class references
- [ ] No `use ... as` aliases for application classes (excluding vendor disambiguation)
- [ ] All namespace segments use PascalCase
- [ ] Sub-namespace depth does not exceed 5-6 levels
- [ ] Root namespace is `App\` unless documented exception exists

### Success Criteria
- [ ] Every PHP file's namespace declaration matches its directory path.
- [ ] All namespace segments use consistent PascalCase.
- [ ] No namespace aliasing is required for application classes.
- [ ] IDE navigation resolves all class references correctly.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Always Declare a Namespace Matching the Directory Path followed
- [ ] Use PascalCase for All Namespace Segments followed
- [ ] Never Use Namespace Aliasing for Application Classes followed
- [ ] Keep Sub-Namespace Depth at 5-6 Levels Maximum followed
- [ ] Keep Root Namespace as `App\` Unless Absolutely Necessary followed
- [ ] Update Both File Path and Namespace When Refactoring followed
- [ ] Never Create Directories Inside `app/` Without PHP Files followed
- [ ] Ensure Custom Namespace Prefixes Do Not Conflict with Vendor Packages followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Flat Namespace
- [ ] Anti-pattern prevented: Deep Namespace Nesting
- [ ] Anti-pattern prevented: Namespace Aliasing Abuse
- [ ] Anti-pattern prevented: Namespace Mismatch
- [ ] Anti-pattern prevented: Custom Root Namespace

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Namespace mismatch:
- [ ] Failure scenario handled: Missing namespace declaration:
- [ ] Failure scenario handled: Wrong root namespace in custom structures:

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns

| Resource | Reference |
|---|---|
| Standardized Knowledge | ./04-standardized-knowledge.md |
| Rules | ./05-rules.md |
| Skills | ./06-skills.md |
| Decision Trees | ./07-decision-trees.md |
| Anti-Patterns | ./08-anti-patterns.md |
