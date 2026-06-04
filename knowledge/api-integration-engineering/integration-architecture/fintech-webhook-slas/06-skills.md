# Skill: Design and Enforce Fintech Webhook SLAs

## Purpose
Design, measure, and enforce Service Level Agreements for fintech webhook integrations, including delivery latency, availability, retry policies, and compliance requirements.

## When To Use
- Fintech/payment webhook integrations
- Regulatory compliance for webhook processing
- SLA-backed integration agreements with partners
- Guaranteeing webhook delivery within time windows

## When NOT To Use
- Non-critical informational webhooks
- Internal-only integrations without SLAs

## Prerequisites
- Webhook delivery infrastructure
- Monitoring and alerting system

## Workflow
1. Define SLA metrics: delivery latency (p50, p95, p99), availability %, processing time
2. Implement SLA measurement: timestamp each webhook lifecycle event
3. Set SLO targets: 99.9% delivered within 5 minutes
4. Configure monitoring dashboards for SLA compliance
5. Alert on SLA breaches and near-breaches
6. Implement escalation policies for SLA violations
7. Document SLA commitments for external partners
8. Conduct regular SLA reviews and adjustments

## Validation Checklist
- [ ] SLA metrics defined (latency, availability, processing time)
- [ ] Webhook lifecycle timestamped for measurement
- [ ] SLO targets documented
- [ ] Monitoring dashboards for SLA compliance
- [ ] Alerts configured for SLA breaches
- [ ] Escalation policies documented
- [ ] SLA commitments documented for partners
