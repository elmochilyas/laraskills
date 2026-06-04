# Skill: Implement Deployment Stamp Pattern

## Purpose

Provision a complete, independent stack of infrastructure (database, cache, queue, app servers) per tenant group, providing maximum isolation and dedicated SLA capability.

## When To Use

- Enterprise tenants requiring dedicated infrastructure
- Maximum isolation required (compliance, performance guarantees)
- Tenant groups can share infrastructure at the stamp level
- Multi-region deployment with tenant placement

## When NOT To Use

- All tenants fit on shared infrastructure
- Operational cost of N stamps exceeds value of isolation
- Team lacks DevOps capability to manage multiple stacks
- < 10 tenants — stamps add unnecessary complexity

## Prerequisites

- Infrastructure as Code (Terraform, Pulumi, Bicep, CloudFormation)
- Container orchestration (Kubernetes, ECS, Nomad)
- Service mesh or load balancer for routing
- Central tenant registry to map tenants to stamps

## Inputs

- Tenant group assignment
- Stamp module (reusable IaC template)
- Network configuration (VPC, subnets, DNS)

## Workflow (numbered steps)

1. Design stamp as a reusable IaC module: database, cache, queue, app server(s), LB
2. Assign tenant groups to stamps (enterprise → dedicated stamp, medium → shared stamp)
3. Deploy stamp using IaC: `terraform apply -var="tenant_group=enterprise"`
4. Configure routing: DNS or LB routes tenant's requests to their stamp
5. Migrate tenant data to new stamp if reassigning
6. Set up per-stamp monitoring, alerting, and backup
7. Document stamp architecture for operations team

## Validation Checklist

- [ ] Stamp deploys with all required components
- [ ] Tenant correctly routed to their stamp
- [ ] No cross-stamp data access possible
- [ ] Per-stamp monitoring configured
- [ ] Per-stamp backup configured

## Common Failures

- Stamp template missing component (no cache, no queue worker)
- Tenant routing wrong — sent to wrong stamp
- Cross-stamp dependencies (database in stamp A, cache in stamp B)
- Stamp deployment fails — tenant has no infrastructure

## Decision Points

- Per-enterprise-tenant stamp vs per-group stamp
- Same IaC module for all stamps vs customized per tier
- Stamp size: small (single app) vs large (high-availability cluster)

## Performance Considerations

- Each stamp has independent resources — no noisy neighbor
- Stamp overhead: minimum viable stamp cost (e.g., 2 app servers + 1 DB)
- Scale stamps independently based on tenant group load

## Security Considerations

- Stamps must be network-isolated (separate VPCs or subnets)
- Cross-stamp communication must be explicitly allowed and encrypted
- Each stamp has its own security group and access controls
- Stamp deployment credentials must be managed per stamp

## Related Rules

- 5-28-1: Always Isolate Stamps Network-Level
- 5-28-2: Never Create Cross-Stamp Dependencies

## Related Skills

- Implement Multi-Region Tenant Placement
- Implement Per-Tenant Scaling
- Implement Tenant Segmentation

## Success Criteria

- Each stamp is fully independent and isolated
- Tenant routed to correct stamp with zero cross-stamp access
- Stamp deployment complete within 30 minutes via IaC

---

# Skill: Implement Tenant-to-Stamp Routing

## Purpose

Route each tenant's requests to the correct deployment stamp while maintaining tenant isolation and enabling per-stamp scaling.

## When To Use

- Deployment stamp pattern with multiple stamps
- Per-stamp DNS or load balancer configuration
- Tenants move between stamps (upgrade, migration)

## When NOT To Use

- Single stamp deployment
- All tenants in same infrastructure stack

## Prerequisites

- DNS management or load balancer configuration
- Tenant registry with stamp assignment
- Health check endpoint per stamp

## Inputs

- Tenant-to-stamp mapping
- Stamp ingress endpoint (DNS, LB IP)
- Routing strategy (DNS, application-level, proxy)

## Workflow (numbered steps)

1. Store tenant's stamp assignment in tenant registry
2. Configure DNS: `{tenant}.saas.com` resolves to stamp's load balancer
3. In application middleware, verify request arrived at correct stamp
4. If wrong stamp, redirect to correct stamp URL
5. For database connections: stamp-specific database endpoint from tenant config
6. Handle stamp migration: update tenant's stamp assignment, redirect traffic gradually
7. Monitor stamp-level metrics: request rate, latency, error rate per stamp

## Validation Checklist

- [ ] Tenant requests reach correct stamp
- [ ] Wrong-stamp requests redirected
- [ ] Stamp migration works without downtime
- [ ] Per-stamp monitoring configured

## Common Failures

- DNS cache sends tenant to old stamp after migration
- Load balancer health check fails — tenant gets 503
- Stamp assignment conflicts (tenant assigned to two stamps)

## Decision Points

- DNS routing vs application-level routing
- Sticky sessions within a stamp vs stateless routing

## Performance Considerations

- DNS routing: TTL determines migration speed (30-300s)
- Application-level routing: add middleware check per request (< 1ms)
- Cross-stamp redirect: adds one round trip latency

## Security Considerations

- Routing must be authenticated (prevent stamp spoofing)
- Stamp-to-stamp communication must be encrypted
- Log all routing decisions for audit

## Related Rules

- 5-28-1: Always Isolate Stamps Network-Level

## Related Skills

- Implement Deployment Stamp Pattern
- Implement Multi-Region Tenant Placement
- Implement Tenant Domains

## Success Criteria

- All tenant requests correctly routed to their stamp
- Stamp migration completes within DNS TTL
- Zero requests routed to wrong stamp
