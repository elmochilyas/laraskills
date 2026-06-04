# Transaction Script (Fowler) — Checklist

## Metadata
- **Domain:** Backend Architecture Design
- **Subdomain:** Enterprise Patterns
- **Knowledge Unit:** Transaction Script
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand MVC controller pattern
- [ ] Know the complexity spectrum: Transaction Script → Table Module → Domain Model
- [ ] Familiar with action classes and single-purpose controllers

## Implementation Checklist
- [ ] Each use case/user action has a dedicated script (controller method or action class)
- [ ] Script handles one transaction from input to output
- [ ] Script is concise (< 100 lines per operation)
- [ ] Validation logic centralized (form request or validation class)
- [ ] Script doesn't mix UI concerns with business logic
- [ ] Script is framework-agnostic where possible (reusable from API + web)

## Verification Checklist
- [ ] No scripts over 100 lines (breaking SRP)
- [ ] No duplicated validation logic across scripts
- [ ] Scripts separated from UI concerns (no `Request` in business logic)
- [ ] Script doesn't assume specific UI (reusable for API + web + CLI)
- [ ] Concerns separated (validation, formatting, DB access in layers)
- [ ] Transaction boundary correct (one script = one DB transaction)

## Security Checklist
- [ ] Input validation before transaction execution
- [ ] Authorization applied within script
- [ ] Output sanitized for presentation layer
- [ ] Rate limiting at entry points

## Performance Checklist
- [ ] Transaction Script has minimal overhead (direct procedural execution)
- [ ] Each script typically does one DB transaction
- [ ] Code duplication can cause N+1 queries if not careful
- [ ] Per-use-case optimization possible (one script, one query plan)

## Production Readiness Checklist
- [ ] Transaction Script complexity evaluated against business domain
- [ ] Refactoring plan in place as logic grows more complex
- [ ] Scripts covered by feature tests
- [ ] Composition used to share common logic (not copy-paste)

## Common Mistakes to Avoid
- [ ] Transaction Script that grows beyond 100 lines (breaking SRP)
- [ ] Duplicating validation logic across multiple scripts (inconsistent rules)
- [ ] Mixing UI concerns in transaction script (controller doing business logic)
- [ ] Transaction script that assumes specific UI (can't reuse for API + web)
- [ ] No separation of concerns (script does validation, formatting, AND DB access)
