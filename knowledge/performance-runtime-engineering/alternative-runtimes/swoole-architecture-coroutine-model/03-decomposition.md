# Decomposition: Swoole Architecture Coroutine Model

## Topic Overview
Swoole implements a **coroutine-based, event-driven** architecture within a single PHP process. An event loop (backed by epoll/kqueue) dispatches I/O events to coroutines. PHP functions are automatically hooked (PDO, MySQLi, Redis, cURL, file operations) to become non-blocking — a process called **one-click coroutineization**. This transparently converts synchronous PHP code into concurrent coroutine-based execution.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
alternative-php-runtimes/swoole-architecture-coroutine-model/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Swoole Architecture Coroutine Model
- **Purpose:** Swoole implements a **coroutine-based, event-driven** architecture within a single PHP process. An event loop (backed by epoll/kqueue) dispatches I/O events to coroutines. PHP functions are automatically hooked (PDO, MySQLi, Redis, cURL, file operations) to become non-blocking — a process called **one-click coroutineization**. This transparently converts synchronous PHP code into concurrent coroutine-based execution.
- **Difficulty:** Foundation
- **Dependencies:
  - --

## Dependency Graph
**Depends on:**
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Vehicle model
  - Runtime selection flow

**Out of scope:**
  (Related topics are covered in other Knowledge Units within the same subdomain)

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization