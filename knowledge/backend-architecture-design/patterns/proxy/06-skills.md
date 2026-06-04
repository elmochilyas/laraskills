# Skill: Implement the Proxy Pattern

## Purpose

Provide a surrogate or placeholder for another object to control access to it.

## When To Use

- Lazy loading (virtual proxy) - expensive objects loaded on demand
- Access control (protection proxy) - restrict permissions
- Logging/monitoring (logging proxy)
- Remote objects (remote proxy) - local representative for remote services

## When NOT To Use

- When the target object is always needed immediately
- When direct access with no additional behavior suffices

## Prerequisites

- Interface-based design and composition

## Workflow

1. Define a subject interface shared by both the real subject and proxy
2. Create the real subject class that implements the interface
3. Create a proxy class that also implements the interface
4. The proxy holds a reference to the real subject
5. The proxy intercepts calls and adds behavior (lazy load, access check, logging) before delegating

## Related Skills

- Apply Indirection GRASP Pattern
- Implement Decorator Pattern
- Apply Protected Variations GRASP Pattern
