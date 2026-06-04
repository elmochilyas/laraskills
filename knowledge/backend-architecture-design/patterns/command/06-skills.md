# Skill: Implement the Command Pattern

## Purpose

Encapsulate a request as an object, allowing parameterization, queuing, logging, and undo/redo of operations.

## When To Use

- Command Bus / CQRS implementations
- Queueable/job-based operations
- Undo/redo functionality
- Macro recording and playback

## When NOT To Use

- Simple method calls that don't need queuing or undo
- When the overhead of a command object is unnecessary

## Prerequisites

- Message/request encapsulation understanding
- CQRS basics

## Workflow

1. Define a command interface with an `execute` (or `handle`) method
2. Create concrete command classes for each operation
3. Encapsulate all required data in the command object
4. Commands can be serialized for queuing or logging
5. Dispatch via a command bus or invoker

## Related Skills

- Implement a Command Bus
- Implement Observer Pattern
- Apply Strategy Pattern
