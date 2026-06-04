# Skill: Map External Webhook Events to Internal Laravel Events

## Purpose
Transform external webhook event payloads into standardized internal Laravel events, decoupling webhook receipt from business logic and enabling consistent handling.

## When To Use
- Multiple webhook sources with different event naming conventions
- Need to decouple external event schemas from internal logic
- Normalizing disparate webhook payloads into unified events

## When NOT To Use
- Single webhook source (direct processing is simpler)
- When payload changes infrequently

## Prerequisites
- Laravel event system
- Webhook receiving endpoint

## Workflow
1. Create internal event classes per business event (`OrderPaid`, `UserUpdated`)
2. Create mapper classes: external payload → internal event
3. Handle naming differences: `charge.completed` → `OrderPaid`
4. Handle payload transformation: flatten, rename fields, cast types
5. Dispatch internal events after webhook verification
6. Use listeners for business logic (decoupled from webhook source)
7. Test mapping with sample external payloads
8. Document event mapping per webhook source

## Validation Checklist
- [ ] Internal event classes defined per business event
- [ ] Mapper transforms external payload to internal event
- [ ] Event naming normalized across sources
- [ ] Payload transformation handles field mapping
- [ ] Internal events dispatched after verification
- [ ] Listeners handle business logic (decoupled)
- [ ] Event mapping documented per source
