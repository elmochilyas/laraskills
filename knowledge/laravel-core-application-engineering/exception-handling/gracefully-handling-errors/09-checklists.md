# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Exception Handling
**Knowledge Unit:** Gracefully Handling Errors
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Catch at the Layer That Can Recover
- [ ] Enforce: Return Null for Expected Absences, Throw for Unexpected
- [ ] Enforce: Never Expose Internal Details to Users
- [ ] Enforce: Always Log or Re-throw — Never Silently Swallow
- [ ] Service methods return null for expected absences
- [ ] Unexpected failures throw custom exception types
- [ ] No HTTP responses returned from service layer
- [ ] Catch blocks either log+re-throw or perform recovery
- [ ] Error messages do not expose stack traces or internals
- [ ] Error reference IDs link user reports to logs
- [ ] Recoverable failures have fallback behavior defined

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers
- [ ] Architecture guideline: Catch at service for recovery
- [ ] Architecture guideline: Catch at controller for HTTP concerns
- [ ] Architecture guideline: Let unhandled exceptions bubble to handler
- [ ] Architecture guideline: Return null for expected absences
- [ ] Architecture guideline: Show generic messages with reference IDs for system errors

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values — configuration is externalized
- [ ] Apply rule: Catch at the Layer That Can Recover
- [ ] Apply rule: Null for Expected, Throw for Unexpected
- [ ] Apply rule: Never Expose Internal Details
- [ ] Apply rule: Always Log or Re-throw
- [ ] Skill applied: Implement Graceful Error Handling
- [ ] Skill applied: Design User-Facing Error Messages

# Security Checklist (from 04/06)
- [ ] Error responses do not leak stack traces or internals
- [ ] Error messages are generic in production
- [ ] No internal file paths or class names in error output
- [ ] Error reference IDs are non-sequential

# Production Readiness Checklist
- [ ] All error paths have been identified and handled
- [ ] Recoverable failures have fallback behavior
- [ ] Error reference IDs enable log correlation
- [ ] Monitoring is configured for unhandled exceptions

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
### Rules (from 05)
- Catch at the Layer That Can Recover
- Return Null for Expected Absences, Throw for Unexpected
- Never Expose Internal Details in User-Facing Messages
- Always Log or Re-throw in Catch Blocks
### Skills (from 06)
- Implement Graceful Error Handling
- Design User-Facing Error Messages
