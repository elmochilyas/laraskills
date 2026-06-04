# Metadata

**Domain:** api-integration-engineering
**Subdomain:** saloonphp
**Knowledge Unit:** dto-vs-resources
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] DTO construction succeeds with valid API response data
- [ ] DTO construction throws on missing required fields (early failure)
- [ ] DTO is immutable after construction (no property changes via reflection)
- [ ] Always Use DTOs for Incoming API Data
- [ ] Centralize DTO Construction in Factory Methods
- [ ] Never Extend Eloquent Model for DTOs
- [ ] Use readonly Properties for DTOs
- [ ] Use Resources for Outgoing, DTOs for Incoming
- [ ] Appropriate pattern used per endpoint
- [ ] DTO chosen for simple typed response data
- [ ] DTOs are immutable with typed properties
- [ ] Analyze response shape: simple flat data â†’ DTO; nested/related â†’ Resource
- [ ] For DTO: implement `Saloon\Dto` or Spatie Data objects
- [ ] For mixed: use DTO in connector response, Resource in controller

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Analyze response shape: simple flat data â†’ DTO; nested/related â†’ Resource
- [ ] For DTO: implement `Saloon\Dto` or Spatie Data objects
- [ ] For mixed: use DTO in connector response, Resource in controller
- [ ] For Resource: extend `Illuminate\Http\Resources\Json\JsonResource`
- [ ] Keep DTOs immutable with typed constructor properties
- [ ] Test both patterns for serialization accuracy
- [ ] Use `DataCollection` for array responses
- [ ] Always Use DTOs for Incoming API Data
- [ ] Centralize DTO Construction in Factory Methods
- [ ] Never Extend Eloquent Model for DTOs
- [ ] Use readonly Properties for DTOs
- [ ] Use Resources for Outgoing, DTOs for Incoming

---

# Performance Checklist

- [ ] Collection of DTOs (100+ items): O(n) instantiation with linear overhead proportional to collection size
- [ ] DTO instantiation: negligible (~0.001ms per DTO) compared to HTTP request latency (50-5000ms)
- [ ] Nested DTO mapping: recursive traversal adds proportional overhead for deeply nested responses
- [ ] Resource `toArray()` calls: executed on response serialization, not on data retrieval
- [ ] Saloon DTO plugin casting: called once per response, negligible overhead

---

# Security Checklist

- [ ] DTOs never receive or store raw user input; they represent processed API data
- [ ] Never trust external API data implicitly; validate DTO fields even when cast automatically
- [ ] Resources should redact sensitive fields (passwords, tokens) in `toArray()` before serialization
- [ ] Validate DTO construction input to prevent malformed data injection from consumed APIs

---

# Reliability Checklist

- [ ] Always Use DTOs for Incoming API Data
- [ ] Never Extend Eloquent Model for DTOs

---

# Testing Checklist

- [ ] Appropriate pattern used per endpoint
- [ ] DTO chosen for simple typed response data
- [ ] DTO construction succeeds with valid API response data
- [ ] DTO construction throws on missing required fields (early failure)
- [ ] DTO is immutable after construction (no property changes via reflection)
- [ ] DTO serialization to JSON preserves all typed fields
- [ ] DTOs are immutable with typed properties
- [ ] Nested DTOs construct correctly from nested API response data
- [ ] Resource `collection()` returns array of resource arrays
- [ ] Resource `toArray()` returns expected JSON structure

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Using stdClass/Arrays Instead of Typed DTOs]
- [ ] [Mutable DTOs â€” Public Setters on Data Objects]
- [ ] [DTO as Eloquent Model (Extending Model for DTOs)]
- [ ] [Using API Resources for Inbound Data Parsing]
- [ ] [God DTO â€” Single DTO for Entire API Response Graph]
- [ ] DTO as Model
- [ ] God DTO
- [ ] Mutable DTO
- [ ] Resource as DTO

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


