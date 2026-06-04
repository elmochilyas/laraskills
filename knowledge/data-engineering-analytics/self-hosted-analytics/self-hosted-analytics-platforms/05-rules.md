# Rules: Self-Hosted Analytics Platforms

## Rule SH-01: Always Use Reverse Proxy
Analytics tracking requests MUST be proxied through a reverse proxy or the Laravel application. Direct browser-to-analytics-server requests are blocked by ad blockers and expose the analytics server URL.

## Rule SH-02: Separate Analytics Database
The analytics platform database MUST run on separate infrastructure from the Laravel application database. Analytics and OLTP workloads have incompatible I/O patterns.

## Rule SH-03: Monitor Infrastructure
Self-hosted analytics infrastructure MUST have active monitoring for disk space, memory, query performance, and backup status. Analytics data loss often goes unnoticed.

## Rule SH-04: Meet Platform Resource Requirements
Deployments MUST meet the analytics platform's documented resource requirements. Underprovisioned analytics servers lose data and become unresponsive.

## Rule SH-05: Back Up Analytics Data
Analytics databases MUST be included in the regular backup strategy. Analytics data is irreplaceable business intelligence.

## Rule SH-06: Internal Network Placement
The analytics server MUST be placed on an internal network, accessible only through the reverse proxy or API gateway. Direct internet exposure is a security risk.

## Rule SH-07: Restrict Dashboard Access
Analytics dashboard access MUST be restricted to authenticated users via SSO, proxy authentication, or IP whitelisting. Dashboards expose sensitive business data.

## Rule SH-08: Keep Analytics Platform Updated
Self-hosted analytics platforms MUST be kept up to date with security patches. Outdated analytics software is a common attack vector.

## Rule SH-09: Set Session Recording Limits
If using PostHog session recording, storage limits and retention periods MUST be configured. Unbounded session recording consumes disk space rapidly.

## Rule SH-10: Plan Data Migration Before Commitment
Before adopting a self-hosted analytics platform, verify that data export capabilities meet requirements. Self-hosted platforms have limited portability.
