# Skill: Generate SaloonPHP Client SDKs from OpenAPI Specifications

## Purpose
Use OpenAPI/Swagger specifications to auto-generate SaloonPHP connector and request classes, reducing boilerplate and ensuring API client accuracy.

## When To Use
- External APIs that provide OpenAPI specifications
- Large APIs with many endpoints (30+)
- Teams needing to keep SDK in sync with API changes
- When manual SDK creation is error-prone and time-consuming

## When NOT To Use
- Small APIs with few endpoints (manual creation is simpler)
- APIs without OpenAPI specs
- Prototype/exploratory stages

## Prerequisites
- SaloonPHP installed
- OpenAPI specification (JSON/YAML)
- `openapi-php/saloon-sdk-generator` or `saloonphp/open-api-generator`

## Workflow
1. Obtain OpenAPI spec from external API provider
2. Install SDK generator: `composer require openapi-php/saloon-sdk-generator`
3. Configure generator with namespace, output directory, base path
4. Run generation: `php artisan saloon:generate --spec=openapi.yaml`
5. Review generated Connector and Request classes
6. Customize: add auth, default headers, error handling
7. Optionally split into assets/features for organization
8. Regenerate when API spec versions change

## Validation Checklist
- [ ] OpenAPI spec obtained from provider
- [ ] SDK generated with correct namespace and base path
- [ ] Generated Connector has correct base URL and auth
- [ ] Generated Request classes have correct methods, paths, params
- [ ] Error handling customized for API-specific error formats
- [ ] Regeneration process documented for API upgrades
