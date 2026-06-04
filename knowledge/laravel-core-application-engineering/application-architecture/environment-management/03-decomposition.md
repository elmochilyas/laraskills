# Decomposition: Environment Management

## Topic Overview
Environment management controls how configuration values differ across deployment environments via .env files, environment detection, and the env() vs config() distinction.

## Decomposition Strategy
This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
`
environment-management/
  +-- 02-knowledge-unit.md
  +-- 03-decomposition.md
`

## Knowledge Unit Inventory

### Environment Management
- **Purpose:** .env file loading, environment detection via APP_ENV, and env() vs config() distinction.
- **Difficulty:** Foundation
- **Dependencies:** Bootstrapping Lifecycle

## Dependency Graph
This KU depends on: Bootstrapping Lifecycle. It serves as prerequisite for Configuration Management.

## Boundary Analysis
**In scope:** Environment detection; .env file loading and cascade priority; env() vs config() usage rules; override priority (server env > .env.{APP_ENV} > .env > defaults); production considerations for config caching.
**Out of scope:** Configuration caching mechanics; config file organization; service provider environment gating.

## Future Expansion Opportunities
None identified � the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization