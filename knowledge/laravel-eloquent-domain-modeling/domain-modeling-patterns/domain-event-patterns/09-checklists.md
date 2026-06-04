# Domain Event Patterns — Checklists

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | domain-modeling-patterns |
| Knowledge Unit | domain-event-patterns |

## Validation Checklist

- [ ] Event class has meaningful name (past tense, domain concept)
- [ ] Event is dispatched from a domain method, not a controller
- [ ] Listeners are registered in EventServiceProvider
- [ ] Event payloads are minimal (IDs preferred for queued listeners)
- [ ] Event dispatching is tested (assert event was dispatched)
- [ ] Listeners are queued for expensive side effects
- [ ] Event names reflect business terminology, not technical details
- [ ] Events capture meaningful business occurrences only (not every save)
