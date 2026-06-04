# Table Module pattern — Checklist

## Metadata
- **Domain:** Backend Architecture Design
- **Subdomain:** Enterprise Patterns
- **Knowledge Unit:** Table Module
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand Row Data Gateway and Record Set patterns
- [ ] Know the difference between Transaction Script, Table Module, and Domain Model
- [ ] Familiar with service class organization in Laravel

## Implementation Checklist
- [ ] Table Module class handles all operations for a single database table
- [ ] Business logic and data access combined per table
- [ ] Row Set operations used for efficient multi-row processing
- [ ] Bulk operations use single queries (not per-row loops)
- [ ] Pagination logic encapsulated in table module

## Verification Checklist
- [ ] Table Module doesn't handle cross-table business logic
- [ ] Class doesn't grow to god class size (too many operations)
- [ ] Concerns not mixed (validation, formatting, persistence separated)
- [ ] Table Module doesn't call other Table Modules (tight coupling)
- [ ] Pattern provides organizational benefit vs Transaction Script

## Security Checklist
- [ ] Input validation at module boundaries
- [ ] Authorization applied before data access
- [ ] Bulk operations respect row-level security

## Performance Checklist
- [ ] Row Set operations efficiently process multiple rows
- [ ] Bulk operations use single queries (not N+1)
- [ ] Not loading entire table when subset is needed
- [ ] Pagination implemented correctly

## Production Readiness Checklist
- [ ] Table Module only used where table-aligned logic makes sense
- [ ] Cross-table logic extracted to appropriate layer
- [ ] Team follows consistent pattern across the codebase
- [ ] Performance impact measured for bulk operations

## Common Mistakes to Avoid
- [ ] Table Module growing to handle every operation (god class)
- [ ] Mixing Table Module concerns (validation, formatting, persistence)
- [ ] Table Module calling other Table Modules (tight coupling)
- [ ] Table Module becoming Transaction Script in disguise (no organizational benefit)
