# OTel Collector Production Hardening — Decomposition

## Metadata
- **Domain:** Observability & Production Intelligence
- **Subdomain:** 09-advanced-topics
- **Knowledge Unit:** otel-collector-production
- **Last Updated:** 2026-06-04

---

## Topic Overview

The OpenTelemetry Collector is a vendor-agnostic proxy that receives, processes, and exports telemetry data. In production, the Collector runs as a sidecar (alongside each application instance) or as a gateway (shared cluster-level service). It handles batching, retries, filtering, sampling, enrichment, and multi-backend export.

---

## Decomposition Strategy

This KU is atomic — it covers a single well-bounded concept (production hardening of the OTel Collector) with independent decisions, tradeoffs, and architecture guidance. Sub-topics (deployment architecture, memory limiting, batching, retry policies, high availability, monitoring) are integral to the single concept and do not warrant separate KUs.

---

## Proposed Folder Structure

```
otel-collector-production/
  02-knowledge-unit.md
  03-decomposition.md
  04-standardized-knowledge.md
  05-rules.md
  06-skills.md
  07-decision-trees.md
  08-anti-patterns.md
  09-checklists.md
```

---

## Knowledge Unit Inventory

### OTel Collector Production Hardening (single unit)
- **Purpose:** Providing comprehensive guidance on deploying, configuring, and maintaining the OTel Collector in production environments
- **Difficulty:** Advanced
- **Dependencies:** OpenTelemetry Ecosystem (Collector role in architecture)

---

## Dependency Graph

**Depends on:**
- OpenTelemetry Ecosystem (Collector role in architecture)
- OTel Auto-Instrumentation (Collector receives auto-instrumented data)

**Depended by:**
- Distributed Tracing (spans flow through Collector)
- Kubernetes observability deployments

---

## Boundary Analysis

**In scope:**
- Two-tier deployment architecture (agent + gateway)
- Pipeline configuration (receivers, processors, exporters)
- Memory limiter and batch processor configuration
- Persistent queue and retry policies
- Health check and Collector monitoring
- Kubernetes deployment patterns (DaemonSet + Deployment)
- TLS security for OTLP communication

**Out of scope:**
- SDK-side exporter configuration (covered in OTel Ecosystem KU)
- Tail-based sampling deep dive (future expansion)
- Vendor-specific backend configuration
- Service mesh integration

---

## Future Expansion Opportunities

- Tail-based sampling strategies in Collector
- OTel Operator for Kubernetes
- Multi-region Collector deployment patterns
- eBPF-based data collection integration
