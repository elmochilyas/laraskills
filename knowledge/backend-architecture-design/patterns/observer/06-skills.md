# Skill: Implement the Observer Pattern

## Purpose

Define a one-to-many dependency between objects so that when one object changes state, all dependents are notified automatically.

## When To Use

- Event-driven architectures (Laravel events are observers)
- Domain event publishing (OrderPlaced triggers notifications)
- When an object needs to notify multiple other objects without knowing them

## When NOT To Use

- Simple synchronous callbacks
- When tight coupling is acceptable and notification logic is simple

## Prerequisites

- Event/listener pattern understanding

## Workflow

1. Define an event/topic for state changes
2. Implement observers/subscribers that listen for specific events
3. Register observers with the subject or event dispatcher
4. When the subject's state changes, publish the event
5. All registered observers receive and process the notification

## Related Skills

- Implement Event Bus Patterns
- Distinguish Between Domain and Integration Events
- Implement Chain of Responsibility Pattern
