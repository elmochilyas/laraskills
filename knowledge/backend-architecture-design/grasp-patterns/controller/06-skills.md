# Skill: Apply the Controller GRASP Pattern

## Purpose

Assign the responsibility of handling system events (external input) to a controller class that delegates to domain logic.

## When To Use

- Receiving external input (HTTP requests, CLI commands, queue messages)
- Coordinating a use case workflow
- Decoupling interface layer from domain logic

## When NOT To Use

- When the "controller" would contain business logic (should delegate)
- Simple CRUD where the framework controller is sufficient

## Prerequisites

- Use case identification
- Separation of concerns understanding

## Workflow

1. Identify external input events (HTTP request, CLI, queue message)
2. Create a controller class for each input channel or use case
3. Receive and parse input into DTOs or command objects
4. Delegate use case execution to application/domain services
5. Format and return the response
6. Never put business logic in the controller

## Related Rules (from 05-rules.md)

- Rule 3 (Layered): Never put business logic in the Presentation layer

## Related Skills

- Apply Information Expert GRASP Pattern
- Implement a Command Bus
- Design a Rich Domain Model
