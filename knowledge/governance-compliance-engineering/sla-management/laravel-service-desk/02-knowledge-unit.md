# Laravel Service Desk

## Metadata
- **Domain:** Governance & Compliance Engineering
- **Subdomain:** sla-management
- **Knowledge Unit:** Laravel Service Desk
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Laravel Service Desk patterns implement internal or customer-facing service desk functionality, managing tickets, SLAs, and support workflows within Laravel applications. For applications with SLA commitments, an integrated service desk provides ticket tracking, SLA monitoring, agent assignment, and customer communication, all within the Laravel ecosystem.

---

## Core Concepts

- **Tickets** represent support requests with status, priority, category, and assignment tracking
- **SLA policies** define response and resolution time targets per ticket type and priority
- **Agent assignment** routes tickets to available support agents based on skills, load, and queue
- **SLA timers** track elapsed time against SLA targets and trigger alerts at thresholds
- **Ticket workflows** define status transitions (new, open, pending, resolved, closed)
- **Customer communication** provides ticket updates, public comments, and notifications
- **Knowledge base integration** links tickets to relevant articles for faster resolution

---

## Mental Models

- **The Help Desk:** Like an IT help desk, users submit tickets, agents triage and resolve, and everything is tracked from open to close with SLAs.
- **The Hospital Triage:** Tickets are triaged by severity — critical (emergency), high (urgent), normal (routine), low (elective) — each with different response targets.
- **The Assembly Line:** Tickets move through a workflow pipeline — receive, triage, assign, work, review, resolve, verify, close — with SLA checkpoints at each stage.

---

## Internal Mechanics

A ticket model stores support requests with status, priority, category, assigned agent, SLA policy reference, and timestamps. SLA policies are stored as configuration with target response time, target resolution time, and escalation thresholds. A scheduled job monitors open tickets against their SLA targets, updating SLA status (on-track, at-risk, breached) and triggering notifications. Ticket workflows are state machine-driven, enforcing valid status transitions. Agent assignment uses round-robin or skill-based routing. Customer notifications are queued and sent via the Laravel notification system.

---

## Patterns

**Tiered Support Pattern:** L1 (first response, common issues), L2 (technical issues), L3 (escalation to developers/engineering). Benefit: Efficient use of specialized skills, cost-effective support. Tradeoff: Ticket handoffs between tiers add resolution time.

**SLA Monitoring Dashboard Pattern:** Real-time dashboard showing ticket volume, SLA compliance rates, agent workload, and breached tickets. Benefit: Visibility into support operations and SLA performance. Tradeoff: Dashboard maintenance and data aggregation overhead.

**Automated Ticket Routing Pattern:** Route tickets to agents based on keywords, customer tier, or AI classification. Benefit: Faster ticket assignment, reduced manual triage. Tradeoff: Routing rules must be maintained and may misroute complex tickets.

---

## Architectural Decisions

Store SLA policy as configuration (database or config file) rather than hardcoded. Use a state machine library (like `spatie/laravel-model-states`) for ticket workflow management. Implement SLA timers as Laravel scheduled commands that check tickets at regular intervals. Use real-time notifications (WebSockets via Laravel Echo) for agent ticket alerts. Monitor SLA compliance as a continuous metric, not just at ticket closure. Implement customer portal for ticket submission and status checking.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Integrated service desk within Laravel | Development time for service desk features | Unified platform but significant development investment |
| SLA monitoring and alerting | SLA timer processing overhead | Automated SLA management but processing cost |
| Customizable ticket workflows | Workflow configuration complexity | Flexible but requires setup for each workflow |
| Agent performance tracking | Agent metrics may encourage gaming | Better visibility but metric manipulation risk |

---

## Performance Considerations

SLA monitoring runs on a schedule (1-5 minute intervals) — minimal performance impact. Ticket queries are the primary load — index status, assigned_agent, priority, created_at. Real-time notifications add WebSocket overhead — use Laravel Echo with Redis for scalable broadcasting. Knowledge base search should use Laravel Scout or full-text search for performance. Customer notification delivery via queue — use separate queue for notifications to avoid blocking ticket operations.

---

## Production Considerations

Define clear SLA policies with customer-facing documentation. Implement SLA breach escalation to management. Monitor agent workload and redistribute tickets if overloaded. Track SLA compliance trends and report to customers. Implement ticket quality reviews. Maintain a knowledge base for common issues to reduce ticket volume. Implement customer satisfaction surveys post-resolution. Back up ticket data for SLA compliance evidence.

---

## Common Mistakes

**SLA targets that are too aggressive** — unsustainable targets lead to burnout and quality issues. Set realistic SLA targets based on capacity and complexity.

**Not tracking SLA at-risk status** — waiting until SLA is breached to act. Monitor approaching SLA breaches and escalate before violation.

**Infinite ticket lifecycle** — tickets never close because resolution steps are missing. Implement auto-close policies for resolved tickets.

---

## Failure Modes

- **SLA timer failure:** Missed SLA checks lead to unreported breaches. Monitor SLA check execution and alert on failures.
- **Ticket routing error:** High-priority ticket assigned to wrong agent. Implement priority-based routing override.
- **Notification delivery failure:** Customer not notified of ticket update. Queue retry with fallback channel.
- **Workflow deadlock:** Ticket stuck in a state with no valid transition. Implement admin override for workflow resolution.

---

## Ecosystem Usage

Laravel service desk implementations typically use: custom models for tickets and SLA data, `spatie/laravel-model-states` for workflow management, Laravel Notifications for customer and agent alerts, Laravel Echo + Reverb for real-time updates, Laravel Scout for knowledge base search, and Laravel Horizon for queue management. Some applications use Filament or Nova as the admin panel for agent interfaces.

---

## Related Knowledge Units

### Prerequisites
- Laravel Notifications and Queues
- Laravel Echo and WebSockets
- Workflow State Machines

### Related Topics
- SLA Timer (SLA time tracking)
- Escalated Laravel (escalation from service desk)
- Queue Autoscale SLA (queue-based SLA for background jobs)

### Advanced Follow-up Topics
- AI-Powered Ticket Classification and Routing
- Multi-Channel Support (email, chat, social, phone)
- ITIL Compliance for Service Desk Operations

---

## Research Notes

Building a service desk within Laravel is a significant development effort. For most applications, integrating with an existing service desk platform (Zendesk, Freshdesk, Jira Service Management) via API is more practical than building from scratch. The service desk functionality within Laravel is most valuable when tickets need tight integration with application data (user accounts, orders, subscriptions) — this is hard to achieve with external platforms. SLA monitoring across tickets requires careful timer management — timers should pause when tickets are in pending state (waiting on customer) and resume when returned to open state.
