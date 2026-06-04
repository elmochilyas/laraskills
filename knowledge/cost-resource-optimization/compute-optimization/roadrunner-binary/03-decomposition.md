# Decomposition: RoadRunner Binary

## Topic Overview
RoadRunner is a high-performance PHP application server written in Go that serves as the backbone for Laravel Octane. Unlike Swoole (a PHP extension), RoadRunner is a standalone binary that communicates with PHP workers via gorge (Go-PHP bridge). For cost optimization, RoadRunner enables smaller container images, simpler deployment, and better resource utilization compared to traditional PHP-FPM or Swoole-based Octane.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-06-roadrunner-binary/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### RoadRunner Binary
- **Purpose:** RoadRunner is a high-performance PHP application server written in Go that serves as the backbone for Laravel Octane. Unlike Swoole (a PHP extension), RoadRunner is a standalone binary that communicates with PHP workers via gorge (Go-PHP bridge). For cost optimization, RoadRunner enables smaller container images, simpler deployment, and better resource utilization compared to traditional PHP-FPM or Swoole-based Octane.
- **Difficulty:** Foundation
- **Dependencies:** - Octane Resource Usage (ku-05), - Worker Pool Sizing (ku-07), - PHP-FPM Tuning (ku-03), - Server Provisioning (ku-02)

## Dependency Graph
**Depends on:**
- Octane Resource Usage (ku-05)
- Worker Pool Sizing (ku-07)
- PHP-FPM Tuning (ku-03)
- Server Provisioning (ku-02)

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- RoadRunner Octane: Default choice for Laravel Octane deployments (simpler than Swoole)
- Containerized environments: Docker images with RoadRunner binary (~30MB) vs FPM+Nginx (~200MB)
- Kubernetes deployments: Single process model (RR handles HTTP + static files)
- Teams without PHP extension experience: RoadRunner requires no PHP extensions (unlike Swoole)
- Multi-protocol apps: RoadRunner supports HTTP, gRPC, jobs (queue workers), WebSocket from one binary
**Out of scope:**
- Existing Nginx/FPM infrastructure: Migrating solely for RoadRunner may not justify effort for low-traffic apps
- Swoole-only features: If app uses Swoole-specific features (coroutines, async I/O), stay with Swoole
- App under 50 req/s: PHP-FPM + Nginx with OPcache handles this trivially; RoadRunner adds operational complexity
- Team unfamiliar with Go: Troubleshooting RoadRunner requires understanding Go binaries and configuration
- Related topics covered in other Knowledge Units within this domain.

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

No Knowledge Unit is overloaded

No major concept is missing

Boundaries are clear

Future phases can operate on individual units

The structure can scale without reorganization