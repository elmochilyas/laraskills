# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Inter-module synchronous communication via contracts
Knowledge Unit ID: MMD-06
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Overview

Synchronous inter-module communication uses contracts (interfaces): Module A depends on a contract that Module B implements. Module A never imports Module B directly. This maintains module independence while enabling type-safe, traceable communication without network overhead.

---

# Core Concepts

- **Contract (interface)**: PHP interface defining what the providing module exposes. The API boundary between modules.
- **Consumer (Module A)**: Depends on contract, not implementation. Laravel container injects implementation at runtime.
- **Provider (Module B)**: Implements the contract. Implementation is internal; only the contract is visible externally.
- **DTOs as contract payloads**: Contract methods accept/return DTOs, not domain entities or Eloquent models.

---

# When To Use

- Module A needs a synchronous response from Module B before proceeding
- Operations that must complete before response is returned to client
- Type-safe, traceable communication is required

---

# When NOT To Use

- Module A only needs to notify Module B without response (use events)
- Modules should not be coupled at all (use events)
- Modules should actually be merged (boundary is wrong)

---

# Best Practices

- **Define contracts in the providing module's `Contracts/` directory.** WHY: The provider owns the interface — they define what they offer and are responsible for backward compatibility.
- **Use DTOs, not domain entities, in contract method signatures.** WHY: DTOs maintain decoupling — domain entities would expose internal module structure.
- **Keep contract interfaces focused** — group related methods into logical service interfaces. WHY: Too many fine-grained interfaces create proliferation without value.
- **Version contracts when breaking changes are needed.** WHY: Contract changes break all consumers. Versioning enables migration.
- **Test contract implementations against contract interface.** WHY: Ensures implementation matches interface contract — catches drift before runtime.

---

# Architecture Guidelines

- Contract in providing module `Contracts/` directory. Consumer imports it.
- Service container binds interface to implementation in providing module's service provider.
- Synchronous contract calls are PHP method calls (microseconds) — fastest inter-module mechanism.
- Contract changes require atomic updates across all consuming modules (same deployment).

---

# Performance Considerations

- Synchronous contract calls: microseconds (PHP method calls).
- This is the fastest inter-module communication mechanism.
- Default for operations needing immediate response.

---

# Security Considerations

- Contracts do not provide security isolation — authorization still applies.
- Ensure contract methods validate caller identity if needed for security boundaries.

---

# Common Mistakes

1. **Implementation in contract namespace:** Placing implementation class in the contract interface directory. Cause: misunderstanding. Consequence: contract directory contains non-contract code. Better: Contracts/ for interfaces only.

2. **Too many contracts:** Separate interface for every cross-module interaction. Cause: over-engineering. Consequence: interface proliferation. Better: group related methods.

3. **Domain entities in contracts:** Methods accepting or returning Eloquent models. Cause: convenience. Consequence: exposes internal module structure. Better: use DTOs.

4. **Circular contract dependency:** Module A's contract depends on B's, which depends on A's. Cause: wrong boundaries. Consequence: prevents module independence. Better: extract shared contracts or merge modules.

---

# Anti-Patterns

- **Contract drift**: Interface changes but implementation doesn't match — caught at runtime.
- **Direct implementation import**: Consumer module imports implementation class instead of interface.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| MMD-05 Module autonomy | MMD-07 Async inter-module communication | CPC-01 Interface contracts |
| MMD-03 Module internal structure | CPC-02 Domain events | CPC-07 Bridge/adapter pattern |

---

# AI Agent Notes

- Always generate contract interfaces for cross-module synchronous communication.
- Place contracts in the providing module's Contracts/ directory.
- Use DTOs for contract method parameters — never Eloquent models or domain entities.

---

# Verification

- [ ] Cross-module communication uses contracts (interfaces), not direct imports
- [ ] Contracts are in providing module's Contracts/ directory
- [ ] Contract methods use DTOs, not domain entities
- [ ] Service container binds contracts to implementations
- [ ] Architecture tests prevent direct cross-module class imports
