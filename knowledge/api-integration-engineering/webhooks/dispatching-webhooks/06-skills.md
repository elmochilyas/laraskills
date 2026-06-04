# Skill: Dispatch Outgoing Webhooks to External Subscribers

## Purpose
Build and send outgoing webhooks to external subscriber endpoints with proper payload structure, signature, and delivery tracking.

## When To Use
- Your Laravel app needs to notify external services of events
- Building an event-driven architecture across multiple services
- Providing webhook notifications to customers or partners

## When NOT To Use
- Internal event broadcasting (use Laravel events + listeners)
- Simple HTTP notifications (use Http facade)

## Prerequisites
- Subscriber endpoints and shared secrets
- Event system (Laravel events or domain events)

## Workflow
1. Define webhook event types and payload schema
2. Create webhook dispatch class for each event type
3. Configure subscriber endpoints and signing secrets
4. Build payload: event type, data, timestamp, signature
5. Send via POST with proper headers
6. Handle delivery response: 2xx = success, other = retry
7. Track delivery status in webhook_deliveries table
8. Log all dispatch attempts and outcomes

## Validation Checklist
- [ ] Event types and payload schema documented
- [ ] Webhook dispatch class per event type
- [ ] Subscriber endpoints configured with secrets
- [ ] Signature generated and included in headers
- [ ] Delivery response handled (success vs retry)
- [ ] Delivery status tracked
- [ ] All dispatches logged
