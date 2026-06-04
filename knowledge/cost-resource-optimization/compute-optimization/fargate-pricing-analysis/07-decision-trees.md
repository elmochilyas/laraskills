# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 01-compute-optimization
**Knowledge Unit:** Fargate Pricing Analysis
**Generated:** 2026-06-03

---

# Decision Inventory

1. Fargate vs EC2 Platform Decision
2. Fargate Task Right-Sizing
3. ECS vs EKS Control Plane Selection

---

# Architecture-Level Decision Trees

---

## Decision Name: Fargate vs EC2 Platform Decision

---

## Decision Context

Choose between Fargate and EC2 for Laravel container workloads.

---

## Decision Criteria

cost, operational_overhead

---

## Decision Tree

Team DevOps capacity?

< 5 engineers -> Fargate (zero server management)
5-10 engineers -> Either; Fargate preferred for velocity
> 10 engineers -> EC2 feasible with ops team

Task count?
< 50 tasks -> Fargate (premium worth it)
> 50 tasks -> EC2 20-40% cheaper

Workload predictability?
Variable -> Fargate (auto-scaling, no planning)
Predictable -> EC2 with RIs (20-40% cheaper)

Need SSH or custom AMIs?
YES -> EC2 required
NO -> Fargate sufficient

---

## Rationale

Fargate carries a 20-40% premium over EC2 for zero server management. Worth it for teams < 5 engineers or < 50 tasks.

---

## Recommended Default

**Default:** Fargate for teams < 5 engineers or < 50 tasks; EC2 for max cost optimization at scale

---

## Risks Of Wrong Choice

Fargate at scale pays 20-40% premium. EC2 with small teams creates ops burden.

---

## Related Rules

Rule: Follow standardized Fargate Pricing Analysis practices

---

## Related Skills

Analyze and Optimize Fargate Pricing Analysis

---

---

## Decision Name: Fargate Task Right-Sizing

---

## Decision Context

Right-size Fargate task CPU and memory to actual utilization.

---

## Decision Criteria

cost, performance

---

## Decision Tree

Actual utilization monitored?

YES -> Size at P95 + 20% headroom
NO -> Start 1 vCPU/2GB, monitor 1 week

Actual memory vs allocation?
< 60% allocated -> Reduce (charges for allocated, not used)
60-80% -> Appropriate sizing
> 80% -> Increase to prevent OOM

ARM vs x86?
ARM available -> Use Graviton (20% cheaper)
x86 required -> Native binary dependencies

Ephemeral storage?
< 20GB -> Free per task
> 20GB -> Additional .000111/GB-hour

---

## Rationale

Fargate charges for allocated memory, not used memory. Over-allocating by 2x wastes 50% of memory cost.

---

## Recommended Default

**Default:** Start 1vCPU/2GB ARM; monitor 1 week; right-size to P95 + 20% headroom

---

## Risks Of Wrong Choice

Over-allocating memory costs 2x more. Under-allocating causes OOM kills.

---

## Related Rules

Rule: Follow standardized Fargate Pricing Analysis practices

---

## Related Skills

Analyze and Optimize Fargate Pricing Analysis

---

---

## Decision Name: ECS vs EKS Control Plane Selection

---

## Decision Context

Choose between free ECS and /month EKS control planes.

---

## Decision Criteria

cost, complexity

---

## Decision Tree

Kubernetes expertise?

Experienced -> EKS viable (/month)
Not experienced -> ECS (simpler, free)

Multi-service architecture?
< 5 services -> ECS sufficient
Many + complex routing -> EKS may help

Cost sensitivity?
HIGH -> ECS (free vs /month adds 100%+ to small deployments)
LOW -> Either; EKS provides portability

Portability needed?
Multi-cloud -> EKS (standard K8s, portable)
AWS-only -> ECS (simpler, integrated, free)

---

## Rationale

ECS is free; EKS costs /month per cluster. For most Laravel apps with 1-5 services, ECS provides equivalent functionality at zero cost.

---

## Recommended Default

**Default:** ECS for most Laravel deployments; EKS only for K8s-experienced teams with multi-cloud needs

---

## Risks Of Wrong Choice

Paying /month EKS for a single service that ECS manages for free doubles infrastructure cost.

---

## Related Rules

Rule: Follow standardized Fargate Pricing Analysis practices

---

## Related Skills

Analyze and Optimize Fargate Pricing Analysis

---

