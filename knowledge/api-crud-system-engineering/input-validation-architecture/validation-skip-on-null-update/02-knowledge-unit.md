# Knowledge Unit: Validation Skip on Null Update

## Metadata

- **ID:** api-crud-system-engineering/input-validation-architecture/validation-skip-on-null-update
- **Domain:** API CRUD System Engineering
- **Subdomain:** Input Validation Architecture
- **Slug:** api-crud-system-engineering-input-validation-architecture-validation-skip-on-null-update
- **Version:** 1.0.0
- **Maturity:** Generated
- **Status:** Published

## Executive Summary

Validation skip on null update handles the ambiguity between null-as-action ("clear this field") and null-as-omission ("don't update this field"). In API design, null and absent have distinct semantics: absent means "don't change the field" (PATCH), null means "set the field to null" (clear). The validation strategy must align with this semantic distinction — using `nullable` when null is a valid update value, and converting null to absent when null means "don't update."

