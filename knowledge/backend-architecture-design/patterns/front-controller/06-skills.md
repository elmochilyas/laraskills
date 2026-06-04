# Skill: Implement the Front Controller Pattern

## Purpose

Provide a centralized entry point for handling all requests, enabling common pre/post processing.

## When To Use

- Web applications needing centralized request handling
- Applying cross-cutting concerns (auth, logging, routing) in one place
- Framework-based applications (Laravel's router is a Front Controller)

## When NOT To Use

- Systems where every request handler is entirely independent
- Event-driven systems where no single entry point exists

## Prerequisites

- HTTP request/response lifecycle understanding

## Workflow

1. Create a single entry point (Laravel's public/index.php)
2. Route requests to appropriate handlers based on URL/method
3. Apply common middleware (auth, CSRF, session) at this level
4. Delegate to controllers for request-specific handling
5. Centralize error handling and response formatting

## Related Skills

- Apply Controller GRASP Pattern
- Implement Decorator Pattern (middleware)
- Implement Gateway Pattern
