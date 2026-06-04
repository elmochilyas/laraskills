# Skill: Set Up Webhook Gateways for Centralized Webhook Management

## Purpose
Use webhook gateways (Svix, Webhook Relay, Custom) to manage webhook delivery, retry, signing, and monitoring externally, reducing integration complexity.

## When To Use
- Multiple webhook subscribers with different delivery requirements
- Need for centralized webhook delivery management
- When building webhook delivery infrastructure is not a core competency
- Scaling webhook delivery beyond simple Laravel queue workers

## When NOT To Use
- Simple, low-volume webhook delivery
- When cost of external gateway is prohibitive
- Compliance requirements preventing external webhook handling

## Prerequisites
- Webhook gateway provider account (Svix, Webhook Relay, etc.)
- API endpoints for webhook dispatch

## Workflow
1. Choose webhook gateway provider
2. Integrate gateway SDK or API into Laravel
3. Configure gateway: endpoints, signing secrets, retry policies
4. Register subscriber endpoints in gateway
5. Dispatch webhooks via gateway API
6. Use gateway's dashboard for delivery monitoring
7. Handle gateway webhook status callbacks
8. Test delivery with gateway's sandbox environment

## Validation Checklist
- [ ] Webhook gateway provider chosen
- [ ] Gateway SDK/API integrated
- [ ] Subscriber endpoints registered
- [ ] Retry policies configured in gateway
- [ ] Webhooks dispatched via gateway
- [ ] Delivery monitoring via gateway dashboard
- [ ] Sandbox testing completed
