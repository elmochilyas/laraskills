# Decomposition: Roadrunner Installation Configuration

## Topic Overview
RoadRunner is a standalone Go binary � no PHP extension required. Download the `rr` binary, create a `.rr.yaml` configuration file defining worker pools, and PHP workers communicate via **Goridge** (binary protocol over stdout/stdin pipes). The Go process manages the goroutine scheduler; PHP workers only handle request business logic.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
alternative-php-runtimes/roadrunner-installation-configuration/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Roadrunner Installation Configuration
- **Purpose:** RoadRunner is a standalone Go binary � no PHP extension required. Download the `rr` binary, create a `.rr.yaml` configuration file defining worker pools, and PHP workers communicate via **Goridge** (binary protocol over stdout/stdin pipes). The Go process manages the goroutine scheduler; PHP workers only handle request business logic.
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
  - Running RoadRunner without OpCache
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