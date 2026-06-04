# Decomposition: Swoole Installation Configuration

## Topic Overview
Swoole is installed as a PHP extension (`ext-swoole` / `ext-openswoole`) and configured via PHP code at server start. Key parameters: `worker_num` (number of worker processes, typically = CPU cores), `max_request` (worker recycling, 1000-5000), and `task_worker_num` (for synchronous task processing). Configuration is done in the server startup script, not php.ini.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
alternative-php-runtimes/swoole-installation-configuration/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Swoole Installation Configuration
- **Purpose:** Swoole is installed as a PHP extension (`ext-swoole` / `ext-openswoole`) and configured via PHP code at server start. Key parameters: `worker_num` (number of worker processes, typically = CPU cores), `max_request` (worker recycling, 1000-5000), and `task_worker_num` (for synchronous task processing). Configuration is done in the server startup script, not php.ini.
- **Difficulty:** Intermediate
- **Dependencies:
  - --

## Dependency Graph
**Depends on:**
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Setting worker_num too high (> CPU cores � 2)
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