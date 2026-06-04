# Knowledge Unit: Request Lifecycle Integration

## Metadata

- **ID:** api-crud-system-engineering/input-validation-architecture/request-lifecycle-integration
- **Domain:** API CRUD System Engineering
- **Subdomain:** Input Validation Architecture
- **Slug:** api-crud-system-engineering-input-validation-architecture-request-lifecycle-integration
- **Version:** 1.0.0
- **Maturity:** Generated
- **Status:** Published

## Executive Summary

Request lifecycle integration determines where input validation fits in Laravel's middleware pipeline relative to authentication, authorization, and other request processing concerns. Validation can run before auth (fail-fast on invalid input) or after auth (when rules depend on the authenticated user). Understanding the middleware pipeline order and the FormRequest lifecycle is essential for placing validation correctly.

