# Skill: Apply the Information Expert GRASP Pattern

## Purpose

Assign responsibility to the class that has the information needed to fulfill it, keeping behavior with the data it operates on.

## When To Use

- Determining where to place a method
- Designing rich domain models
- Assigning responsibilities during class design

## When NOT To Use

- When the responsibility spans multiple objects (use domain service)
- When the expert would become coupled to infrastructure concerns

## Prerequisites

- Object-oriented design understanding
- Domain model pattern knowledge

## Workflow

1. Identify the responsibility that needs to be fulfilled
2. Find which class has the data needed to fulfill it
3. Assign the responsibility to that class
4. If the data is spread across multiple classes, consider a domain service or coordinator
5. Keep the method cohesive with the class's existing responsibilities

## Related Rules (from 05-rules.md)

- Rule 1 (Anemic vs Rich): Never allow domain entities to be property bags with zero behavior
- Rule 2 (Anemic vs Rich): Keep domain logic inside the model, not in application services

## Related Skills

- Design a Rich Domain Model
- Apply High Cohesion GRASP Pattern
- Apply Creator GRASP Pattern
