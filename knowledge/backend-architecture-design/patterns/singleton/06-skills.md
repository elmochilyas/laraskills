# Skill: Implement the Singleton Pattern

## Purpose

Ensure a class has exactly one instance and provide a global point of access to it.

## When To Use

- Shared resources (configuration, logging, database connection) where multiple instances would be problematic
- When exactly one instance of a class must coordinate actions across the system

## When NOT To Use

- As a substitute for dependency injection (use the container instead)
- When testing needs mock instances (singletons are hard to mock)
- When multiple instances may be needed later

## Prerequisites

- Global state understanding
- Testing implications of singletons

## Workflow

1. Make the constructor private to prevent direct instantiation
2. Create a private static instance variable
3. Provide a public static method `getInstance()` that returns the single instance
4. Create the instance lazily (on first access) or eagerly (on class load)
5. Consider using the service container with `singleton()` binding instead when in Laravel

## Related Skills

- Implement Registry Pattern
- Apply Pure Fabrication GRASP Pattern
- Design Hexagonal Architecture
