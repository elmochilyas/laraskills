# Skill: Implement the Abstract Factory Pattern

## Purpose

Provide an interface for creating families of related or dependent objects without specifying their concrete classes.

## When To Use

- Creating families of related products (UI widgets for different OS, database drivers)
- When the system should be configured with one of multiple families of products
- Enforcing that products from the same family are used together

## When NOT To Use

- Simple object creation (Factory Method suffices)
- Only one product family exists

## Prerequisites

- Factory Method pattern
- Interface-based design

## Workflow

1. Identify product families that need to be created together
2. Define abstract interfaces for each product type
3. Define an Abstract Factory interface with creation methods for each product
4. Implement concrete factories for each product family
5. Clients use the abstract factory interface, not concrete factories

## Related Skills

- Implement Factory Method Pattern
- Implement Builder Pattern
- Apply Creator GRASP Pattern
