# Metadata

Domain: Application Architecture Patterns
Subdomain: Communication Patterns and Contracts
Knowledge Unit: Formalized contracts between contexts
Knowledge Unit ID: CPC-01
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Overview

Formalized contracts are explicit, versioned interfaces defining how bounded contexts communicate. Each contract specifies data shapes, allowed operations, error contracts, and versioning policy. Contracts decouple contexts: a consumer depends on the contract, not the producer's implementation. Changes preserving the contract don't affect consumers. Breaking changes require a new contract version.

---

# Core Concepts

- **Contract**: Data shape (DTO) + allowed operations (interface). The DTO defines shape, interface defines operations/errors.
- **Versioned contract**: Breaking changes increment the version. Multiple versions coexist during migration.
- **Contract boundary**: The line where a contract applies. Within a context, free to change interfaces.
- **Contract-first**: Define contract before implementing either side.

---

# When To Use

- Every pair of communicating contexts needs a contract.
- Cross-context synchronous communication.

---

# When NOT To Use

- Within a single context (interfaces are internal).
- Trivial one-way communication (use events).

---

# Best Practices

- **Define contracts at context boundaries.** WHY: Every pair of communicating contexts needs a contract. Within a context, interfaces are internal and can change freely.
- **Use semantic versioning for contracts.** WHY: Major version = breaking change, minor = additive, patch = bug fix. Consumers pin to a major version and upgrade when they choose.
- **Use readonly DTOs in contracts.** WHY: If the consumer modifies the DTO, it creates hidden coupling. Contracts should be immutable.
- **Always contract test both sides.** WHY: Both producer and consumer should test against the same contract. Producer verifies it satisfies the contract. Consumer verifies it can work with the contract.

---

# Architecture Guidelines

- Interface + DTO define the contract.
- Contract lives in the producing module (or a shared Contracts directory).
- Producer implements. Consumer depends on interface.
- Versioned contracts enable independent upgrade.

---

# Performance Considerations

- In-process contract calls: microseconds.
- Serialization/deserialization cost for DTOs at boundary crossings.

---

# Security Considerations

- Contracts define what data crosses boundaries. Only contract-defined data is shared.

---

# Common Mistakes

1. **No contract:** Communicating contexts without a defined contract. Cause: oversight. Consequence: changes in one break the other. Better: define contracts.

2. **Contract = implementation:** Defining contract in terms of producer's internals (Eloquent models). Cause: convenience. Consequence: contract reflects implementation details. Better: independent DTOs.

3. **Backward-incompatible changes without versioning:** Adding required field to DTO consumers don't fill. Cause: oversight. Consequence: breaks consumers. Better: version contracts.

---

# Anti-Patterns

- **Silent contract violation**: Producer changes contract without versioning. Consumers break silently.
- **Contract pollution**: DTOs with 20+ fields — consumers depend on unnecessary data.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| DBC-01 Bounded context basics | CPC-02 Domain events | CPC-05 Message bus |
| SLP-03 Contract interfaces | CPC-07 Bridge/adapter pattern | CPC-11 Distributed tracing |

---

# AI Agent Notes

- Generate contracts (interface + DTO) for cross-context communication.
- Use semantic versioning.
- Contract test both sides.

---

# Verification

- [ ] Cross-context communication has defined contracts
- [ ] Contracts use DTOs (not Eloquent models)
- [ ] Contracts are versioned
- [ ] Both producer and consumer test against contracts
- [ ] No backward-incompatible changes without version increment
