# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 01-compute-optimization
**Knowledge Unit:** RoadRunner Binary
**Generated:** 2026-06-03

---

# Decision Inventory

1. RoadRunner vs Swoole for Octane
2. RoadRunner Worker Pool Configuration
3. RoadRunner Deployment Architecture

---

# Architecture-Level Decision Trees

---

## Decision Name: RoadRunner vs Swoole for Octane

---

## Decision Context

Choose between RoadRunner (Go) and Swoole (PHP extension) as Octane server backend.

---

## Decision Criteria

complexity, performance, deployment

---

## Decision Tree

Deployment environment?

Docker containers -> RoadRunner (simpler, no PHP extension)
Self-managed server -> Either; RR simpler, Swoole slightly faster
Kubernetes -> RoadRunner (single binary, ~30MB image)

Team expertise?
PHP-only team -> RoadRunner (no extension compilation)
PHP extension experience -> Swoole acceptable

Performance requirement?
Maximum throughput -> Swoole 5-10% faster for CPU-bound
Standard -> RoadRunner sufficient (2000+ req/s)
Debugging simplicity -> RoadRunner (Go binary)

---

## Rationale

RoadRunner is a static Go binary with no PHP extension dependencies, simplifying Docker builds. Swoole requires pecl install and extension loading but offers slightly higher throughput.

---

## Recommended Default

**Default:** RoadRunner for most deployments; Swoole only if maximum throughput critical with extension expertise

---

## Risks Of Wrong Choice

Swoole extension conflicts cause crashes after N requests. Missing RR health check causes total downtime.

---

## Related Rules

Rule: Follow standardized RoadRunner Binary practices

---

## Related Skills

Analyze and Optimize RoadRunner Binary

---

---

## Decision Name: RoadRunner Worker Pool Configuration

---

## Decision Context

Configure worker pool size and restart thresholds in .rr.yaml.

---

## Decision Criteria

performance, reliability

---

## Decision Tree

CPU cores available?

Set num_workers = CPU cores (CPU-bound)
Set num_workers = 1.5-2x cores (I/O-heavy)

max_jobs setting?
Set 500-1000 to prevent memory leaks
Workers restart after N requests, releasing memory

max_memory per worker?
Set 128MB restart threshold
Monitor actual memory; adjust if workers restart too frequently

Static files served directly?
Enable static plugin in .rr.yaml for direct asset serving
No need for separate Nginx reverse proxy layer

---

## Rationale

max_jobs and max_memory provide two independent safety mechanisms against memory leaks. Workers restart after either threshold is hit, ensuring stable long-term operation.

---

## Recommended Default

**Default:** num_workers = CPU cores, max_jobs = 500, max_memory = 128MB, enable static plugin

---

## Risks Of Wrong Choice

No max_jobs = unbounded memory growth. Over-allocating workers causes CPU thrashing.

---

## Related Rules

Rule: Follow standardized RoadRunner Binary practices

---

## Related Skills

Analyze and Optimize RoadRunner Binary

---

---

## Decision Name: RoadRunner Deployment Architecture

---

## Decision Context

Design deployment with single-process container model.

---

## Decision Criteria

complexity, performance

---

## Decision Tree

Static assets strategy?

Single process -> Use RR static plugin (no Nginx needed)
Separate CDN -> CloudFront/S3 for assets, RR for API

Container image size?
Concern -> RR single binary ~30MB vs 200MB Nginx+FPM image
No concern -> Either approach works

Process management?
Docker -> RR as ENTRYPOINT, health check on /health
Kubernetes -> Single container with liveness probes
Systemd -> RR service with auto-restart

Port configuration?
Expose 8080 (RR default), ALB targets this port
No need for port 80/443 internally (terminated at ALB)

---

## Rationale

RoadRunner serves HTTP and static files directly, eliminating the Nginx reverse proxy layer. This reduces deployment complexity, container image size, and operational surface area.

---

## Recommended Default

**Default:** Single Docker container with rr serve entrypoint, static plugin, health check endpoint

---

## Risks Of Wrong Choice

Adding unnecessary Nginx in front of RR adds complexity. No process manager = single point of failure.

---

## Related Rules

Rule: Follow standardized RoadRunner Binary practices

---

## Related Skills

Analyze and Optimize RoadRunner Binary

---

