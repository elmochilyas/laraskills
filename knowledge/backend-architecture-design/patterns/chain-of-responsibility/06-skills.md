# Skill: Implement Chain of Responsibility Pattern

## Purpose

Pass a request along a chain of handlers, allowing each handler to process or forward the request.

## When To Use

- Middleware pipelines (Laravel HTTP middleware is a chain)
- Multi-step validation or processing
- When multiple handlers could process a request but the handler is unknown beforehand

## When NOT To Use

- Simple conditional logic (chain adds unnecessary complexity)
- When all handlers must always execute

## Prerequisites

- Handler interface definition
- Pipeline pattern understanding

## Workflow

1. Define a handler interface with a `handle` method and optional `next` setter
2. Create concrete handlers that either process or forward the request
3. Chain handlers in the desired order
4. Pass the request through the chain
5. Each handler decides to process (and optionally forward) or skip

## Related Skills

- Implement Decorator Pattern
- Apply Middleware Pattern
- Implement Observer Pattern
