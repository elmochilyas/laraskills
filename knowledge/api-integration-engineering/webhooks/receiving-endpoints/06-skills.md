# Skill: Create Secure Incoming Webhook Receiving Endpoints

## Purpose
Design and implement secure webhook receiving endpoints with signature verification, validation, and appropriate HTTP response patterns.

## When To Use
- Any application receiving webhooks from external services
- Building the initial webhook integration for a new provider

## When NOT To Use
- Internal event broadcasting (not webhooks)

## Prerequisites
- Route defined in `routes/api.php`
- Webhook provider documentation
- Shared secret from provider

## Workflow
1. Define POST route in `routes/api.php` (no CSRF needed)
2. Log request headers and payload for debugging
3. Verify signature using provider's scheme
4. Validate payload schema and required fields
5. Dispatch job or process synchronously
6. Return 200 with acknowledgment body
7. Return 401 on invalid signature, 400 on invalid payload, 500 on processing error
8. Add monitoring for webhook receipt rate and error rate

## Validation Checklist
- [ ] POST route defined in `routes/api.php`
- [ ] Signature verified before processing
- [ ] Payload validated against expected schema
- [ ] Appropriate HTTP responses (200, 401, 400, 500)
- [ ] Request headers/payload logged for debugging
- [ ] Monitoring for receipt rate and error rate
