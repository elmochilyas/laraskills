# Decomposition: Spatie Laravel Health

## Topic Overview
Spatie Laravel Health is the most popular third-party health check package for Laravel (870+ GitHub stars). It provides a fluent API for registering health checks against application dependencies (database, Redis, queue, disk, CPU), configurable result stores (database, JSON file), and notification channels (mail, Slack, Discord). Health checks run as scheduled Artisan commands and expose results via an endpoint and dashboard.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
health-checks/spatie-laravel-health/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Spatie Laravel Health
- **Purpose:** Spatie Laravel Health is the most popular third-party health check package for Laravel (870+ GitHub stars). It provides a fluent API for registering health checks against application dependencies (database, Redis, queue, disk, CPU), configurable result stores (database, JSON file), and notification channels (mail, Slack, Discord). Health checks run as scheduled Artisan commands and expose results via an endpoint and dashboard.
- **Difficulty:** Intermediate
- **Dependencies:
  - Health Check Endpoint Design (Laravel 11+ built-in `/up` endpoint)
  - Notification Routing & Escalation (health check notification channels)

## Dependency Graph
**Depends on:**
  - Health Check Endpoint Design (Laravel 11+ built-in `/up` endpoint)
  - Notification Routing & Escalation (health check notification channels)

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Check
  - Result
  - Result store
  - Check registry
  - Scheduled command
  - Notifications

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