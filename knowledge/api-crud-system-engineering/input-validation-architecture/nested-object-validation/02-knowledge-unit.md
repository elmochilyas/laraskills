# Knowledge Unit: Nested Object Validation

## Metadata

- **ID:** api-crud-system-engineering/input-validation-architecture/nested-object-validation
- **Domain:** API CRUD System Engineering
- **Subdomain:** Input Validation Architecture
- **Slug:** api-crud-system-engineering-input-validation-architecture-nested-object-validation
- **Version:** 1.0.0
- **Maturity:** Generated
- **Status:** Published

## Executive Summary

Nested object validation handles validating structured data within request payloads — arrays of items, nested object properties, and mixed structures. Laravel's validation system uses dot notation (`field.nested_field`) for named properties and wildcard notation (`array.*.field`) for uniform lists. Choosing the correct syntax is critical: wildcard notation applies the same rules to every item, while dot notation targets specific properties.

