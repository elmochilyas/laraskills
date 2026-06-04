# Skill: Implement the Lazy Load Pattern

## Purpose

Delay loading of an object until it is actually needed, avoiding unnecessary database queries and memory usage.

## When To Use

- Expensive-to-load associations that aren't always needed
- Large object graphs where eager loading is wasteful
- Improving initial page load time

## When NOT To Use

- When the association is always needed (lazy loading adds overhead)
- When N+1 query problems would outweight the benefit

## Prerequisites

- Proxy pattern understanding
- ORM lazy loading mechanisms

## Workflow

1. Identify expensive-to-load associations that are infrequently accessed
2. Implement lazy loading via proxy objects, ghost objects, or virtual proxies
3. When the association is accessed, load from persistence
4. Cache the loaded value for subsequent accesses
5. Monitor for N+1 query patterns and optimize with eager loading where needed

## Related Skills

- Implement Proxy Pattern
- Implement Data Mapper Pattern
- Apply Identity Map Pattern
