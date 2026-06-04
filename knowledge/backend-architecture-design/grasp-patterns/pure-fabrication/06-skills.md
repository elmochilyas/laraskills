# Skill: Apply the Pure Fabrication GRASP Pattern

## Purpose

Create a class that does not represent a domain concept to achieve low coupling and high cohesion when a domain class would be burdened.

## When To Use

- No domain class naturally fits the responsibility
- Assigning the responsibility to a domain class would violate high cohesion or low coupling
- Infrastructure concerns (persistence, logging, serialization) don't belong in domain classes

## When NOT To Use

- When a domain class is the natural Information Expert
- Creating a fabrication for every small piece of logic (over-fabrication)

## Prerequisites

- Domain model vs infrastructure distinction
- Cohesion and coupling understanding

## Workflow

1. Identify a responsibility that has no natural domain class
2. Determine if assigning it to a domain class would violate cohesion or coupling
3. Create a new class (fabrication) to own the responsibility
4. Ensure the fabrication has a clear, single purpose
5. Place the fabrication in the appropriate layer (application services, infrastructure)
6. Use the fabrication to mediate between domain and infrastructure concerns

## Related Skills

- Apply Information Expert GRASP Pattern
- Apply High Cohesion GRASP Pattern
- Design Hexagonal Architecture (Ports and Adapters)
