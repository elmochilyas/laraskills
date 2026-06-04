# Skill: Build Health Checks for External API Integrations

## Purpose
Implement health check endpoints that probe external API connectivity and return integration status for monitoring, load balancers, and dashboards.

## When To Use
- Production integrations needing uptime monitoring
- Health check endpoints for load balancer routing
- Integration status dashboards
- Automated monitoring and alerting

## When NOT To Use
- Internal-only integrations (health checks add overhead)
- Development environments

## Prerequisites
- External API endpoints for health probing
- Laravel health check routing or package

## Workflow
1. Design health check per integration (simple ping or authenticated call)
2. Implement health check service class per integration
3. Return status: healthy, degraded, unhealthy
4. Add response time measurement per health check
5. Register routes: `/health/integrations`
6. Add health check to external monitoring (Pingdom, Datadog)
7. Alert on unhealthy status for critical integrations
8. Cache health check results with short TTL

## Validation Checklist
- [ ] Health check implemented per integration
- [ ] Status levels: healthy, degraded, unhealthy
- [ ] Response time measured per check
- [ ] Health route registered `/health/integrations`
- [ ] External monitoring configured
- [ ] Alerts for unhealthy critical integrations
- [ ] Health results cached with short TTL
