# Decomposition: Opcache File Cache Container Cold Start

## Topic Overview
OpCache file cache (`opcache.file_cache`) persists compiled opcodes to disk, enabling cache reuse across PHP-FPM restarts and container deployments. With `opcache.file_cache_only` (PHP 8.5+), OpCache can serve exclusively from the file cache without shared memory — critical for containerized environments where shared memory is ephemeral and cold-starts must be minimized.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
opcache-configuration/opcache-file-cache-container-cold-start/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Opcache File Cache Container Cold Start
- **Purpose:** OpCache file cache (`opcache.file_cache`) persists compiled opcodes to disk, enabling cache reuse across PHP-FPM restarts and container deployments. With `opcache.file_cache_only` (PHP 8.5+), OpCache can serve exclusively from the file cache without shared memory — critical for containerized environments where shared memory is ephemeral and cold-starts must be minimized.
- **Difficulty:** Advanced
- **Dependencies:
  - --

## Dependency Graph
**Depends on:**
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - CI/CD file cache warm-up
  - Library model
  - Tiered cache warming

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