# Decomposition: Cross-Feature Communication

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Feature-Based Structure
- **Knowledge Unit:** Cross-Feature Communication
- **Difficulty Level:** Advanced

## Atomic Chunks

### Chunk 1: Direct Access Anti-pattern
- **Topics:** Why features should not directly access each other's models or services
- **Key Content:** Tight coupling consequences, boundary violations, refactoring costs
- **Learning Objectives:** Identify and prevent direct cross-feature access to models and internal services

### Chunk 2: Shared Service Interfaces
- **Topics:** Defining interfaces in shared kernel, implementing in features, service contracts
- **Key Content:** Interface definition in `app/Kernel/Contracts/`, feature implements, consuming through contract
- **Learning Objectives:** Design shared service interfaces that enable features to communicate without coupling

### Chunk 3: Event-Based Communication
- **Topics:** Features dispatch domain events, other features listen asynchronously
- **Key Content:** `Event::dispatch()`, listeners in other features, queueing for decoupling
- **Learning Objectives:** Implement event-based cross-feature communication for asynchronous, decoupled interactions

### Chunk 4: Command/Bus Communication
- **Topics:** Shared command bus, feature dispatches commands to other features
- **Key Content:** Command pattern, bus dispatch, handling in target feature, return value considerations
- **Learning Objectives:** Use a command/bus pattern for synchronous cross-feature communication with explicit contracts
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization