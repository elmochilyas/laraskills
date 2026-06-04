# Skill: Generate PHP SDKs from External API Specifications

## Purpose
Generate PHP SDK packages from OpenAPI/Swagger specifications to provide type-safe, versioned API clients for internal or external consumption.

## When To Use
- Building PHP SDKs for your own API
- Generating internal API clients from OpenAPI specs
- Distributing SDK as a Composer package
- Maintaining multiple SDK packages across API versions

## When NOT To Use
- Single-use API integration (Saloon client is simpler)
- APIs without OpenAPI specs

## Prerequisites
- OpenAPI specification
- SDK generator: `openapi-php/saloon-sdk-generator` or `openapi-generator`
- Packagist/GitHub for distribution

## Workflow
1. Obtain OpenAPI spec for the API
2. Choose generator: Saloon generator, OpenAPI Generator, or custom
3. Configure generator: namespace, package name, authentication
4. Generate SDK classes (Connectors, Requests, DTOs)
5. Customize: add error handling, middleware, logging
6. Package as Composer package with `composer.json`
7. Version SDK alongside API version
8. Publish to Packagist or private repository

## Validation Checklist
- [ ] OpenAPI spec obtained and validated
- [ ] SDK generator configured correctly
- [ ] Generated classes compile without errors
- [ ] Auth, error handling, logging customized
- [ ] Composer package configured
- [ ] SDK versioned alongside API version
- [ ] SDK published and installable
