# Knowledge Unit: Validation Skip on Edit

## Metadata

- **ID:** api-crud-system-engineering/input-validation-architecture/validation-skip-on-edit
- **Domain:** API CRUD System Engineering
- **Subdomain:** Input Validation Architecture
- **Slug:** api-crud-system-engineering-input-validation-architecture-validation-skip-on-edit
- **Version:** 1.0.0
- **Maturity:** Generated
- **Status:** Published

## Executive Summary

Validation skip on edit determines which fields are validated during update operations. Not all fields in the request need re-validation on every update — unchanged fields can skip expensive checks like uniqueness and existence. Laravel's `sometimes` rule validates a field only when it is present in the input array. For PUT (full update) semantics, custom skip logic compares input with database values to avoid re-validating unchanged data.

