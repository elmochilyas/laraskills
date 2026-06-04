# Skill: Apply the Creator GRASP Pattern

## Purpose

Assign the responsibility of creating a new instance to the class that has the data or context needed for creation.

## When To Use

- Determining which class should create instances of another class
- Object creation where the creator has the necessary initialization data
- Aggregates creating child entities

## When NOT To Use

- When creation logic is complex (use Factory pattern instead)
- When the creator would become coupled to the created class unnecessarily

## Prerequisites

- Object composition understanding
- Aggregation relationships

## Workflow

1. Identify which class needs to be created
2. Find the class that contains or closely uses the created class
3. If the creator has the necessary initialization data, assign creation to it
4. If creation is complex, delegate to a Factory instead
5. Avoid coupling the creator to classes it doesn't need

## Related Skills

- Apply Information Expert GRASP Pattern
- Apply Pure Fabrication GRASP Pattern
- Implement Factory Pattern
