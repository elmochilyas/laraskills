# Skill: Detect and Fix Single Responsibility Principle Violations

## Purpose

Ensure each class has one clearly defined responsibility and one reason to change, preventing "God classes" and improving maintainability.

## When To Use

- Eloquent models with mixed concerns (auth, billing, notifications, reporting)
- Controllers handling multiple use cases
- Classes with many public methods unrelated to a single concept

## When NOT To Use

- Over-splitting into too many small classes (navigation overhead)
- When the class genuinely has one cohesive responsibility

## Prerequisites

- Cohesion concepts
- Action Domain / Service Layer pattern

## Workflow

1. List reasons a class might change (each is a potential responsibility)
2. Extract each responsibility into a separate class (action classes, services, value objects)
3. Ensure new classes are cohesive (all methods serve the same purpose)
4. Verify tests: each extracted responsibility should be independently testable
5. Keep the original class focused on its core responsibility only

## Related Skills

- Detect God Class Anti-Pattern
- Apply High Cohesion GRASP Pattern
- Apply Controller GRASP Pattern
