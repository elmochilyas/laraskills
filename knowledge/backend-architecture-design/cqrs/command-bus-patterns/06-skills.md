# Skill: Implement a Command Bus

## Purpose

Decouple command dispatch from handler execution using a bus with middleware pipeline support.

## When To Use

- Applications with clearly defined use cases (commands)
- Need for transactional middleware around write operations
- Queued/asynchronous command execution
- Audit trail requirements for write operations

## When NOT To Use

- Simple CRUD with no need for middleware
- When the overhead of command objects outweighs the benefit
- Read-only operations (use query handlers instead)

## Prerequisites

- Command pattern understanding
- Laravel Bus facade or custom bus implementation
- Middleware pattern knowledge

## Inputs

- Use case specifications
- Transactional boundaries
- Middleware requirements (logging, validation, transactions)

## Workflow

1. Define each command as an immutable named object (e.g., `PlaceOrder`, `CancelInvoice`)
2. Create exactly one handler per command class
3. Register all commands declaratively (auto-discovery or explicit mapping)
4. Route all commands through a single bus abstraction
5. Add transactional middleware wrapping every command dispatch
6. Keep handlers synchronous, stateless, and returning void (or aggregate ID)
7. Never invoke handlers directly from controllers
8. Write unit tests for each command handler with mocked dependencies

## Validation Checklist

- [ ] Each command is an immutable named object representing user intent
- [ ] One-to-one mapping: one command -> one handler
- [ ] No conditional dispatch inside handlers based on command fields
- [ ] Handlers synchronous and stateless
- [ ] Transactional middleware wraps all command dispatches
- [ ] Controllers dispatch to bus, not directly to handlers
- [ ] Commands contain serializable data only (for queue support)

## Common Failures

- Generic command classes with type field (lost domain intent)
- Return values from commands (blurs CQRS boundary)
- Handlers with state causing concurrency issues
- Conditional dispatch inside handlers (hidden sub-use-cases)
- Commands with non-serializable data (queue failures)

## Decision Points

- Sync vs async dispatch for each command?
- Which middleware to apply globally vs per-command?
- Return aggregate ID or void from handlers?

## Performance Considerations

- Sync dispatch: negligible overhead
- Async dispatch (queue): ~100-500ms latency depends on queue
- Middleware pipeline adds sequential time per layer
- Keep middleware count minimal (< 5)

## Security Considerations

- Validate commands before dispatch (in middleware or request)
- Authorization checks in middleware before handler execution
- Commands must not contain sensitive data if queued (encrypted queues)

## Related Rules (from 05-rules.md)

- Rule 1: Every command must be a named object representing a user's intent
- Rule 2: Each command must have exactly one handler
- Rule 3: Handlers must be synchronous, stateless, and return void
- Rule 4: Route commands to handlers via a single command bus abstraction
- Rule 5: Wrap every command dispatch with transactional middleware

## Related Skills

- Implement Query Handlers
- Apply CQRS Selectively per Bounded Context
- Implement Event Bus Patterns

## Success Criteria

- Every write use case has a corresponding named command class
- Dispatches go through the bus, never direct to handlers
- Transactional middleware ensures atomicity for all write operations
