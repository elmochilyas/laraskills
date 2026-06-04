# Experience Curation: Internal Template Registries (Laravel Project Templates)

## Metadata
- **KU ID:** internal-developer-platforms-idp/internal-template-registries
- **Phase:** 4 (Experience Curation)
- **ECC Version:** 1.0
- **Curator:** Phase 4 Standardization Process
- **Date Curation Completed:** 2026-06-02
- **Maturity:** Maturing
- **Dependencies:** golden-path-paved-road-patterns, self-service-environment-provisioning, idp-architecture-patterns
- **Related Technologies:** Laravel Installer, Composer create-project, GitHub Templates, Cookiecutter
- **Target Audience:** Platform engineers, Laravel team leads, DevOps engineers

## Overview

Internal template registries are curated collections of Laravel project skeletons that encode organizational standards—PHP version, code style configuration (pint.json), static analysis setup (phpstan.neon), CI pipelines, Docker Compose services, deployment scripts, and starter kit selections. Teams choose a template when creating a new project, ensuring every Laravel application starts with compliant tooling and configuration. Templates range from minimal (bare Laravel installer) to opinionated (full microservice skeleton with API scaffolding, DTOs, repositories, and service layer patterns). The registry is distributed via composer packages, Git repositories, or CLI tools.

## Core Concepts

- **Project Skeleton:** A pre-configured Laravel directory structure with organization-specific tooling, configuration files, and documentation templates
- **Template Parameterization:** Templates accept parameters (project name, starter kit, database type, PHP version) and generate customized output via placeholders
- **Template Registry:** A catalog of available templates with metadata (purpose, Laravel version, services included, recommended for)
- **Template Versioning:** Templates are versioned independently from the projects they generate
- **Template as a Contract:** Each template encodes organizational standards and guarantees a minimum baseline of tooling, security, and quality practices
- **Base + Overlay Pattern:** A "base" template (minimal configuration) with overlay templates adding specific functionality

## When To Use

- Organization has 3+ Laravel applications and wants consistent initial configuration
- New projects require specific tooling setup (Pint, PHPStan, Pest, Sail) that takes > 30 minutes to configure manually
- Need to enforce organizational standards (PHP version, code style, CI pipelines) from project inception
- Multiple teams create Laravel projects and need a standardized starting point
- Team wants to capture and reuse proven project architectures (API skeleton, monolith structure, package skeleton)

## When NOT To Use

- Single application with no plans for additional projects
- Team prefers to configure each project from scratch (acceptable for small teams)
- Organizational standards change too frequently for templates to stay current
- Team lacks resources to maintain and update templates regularly

## Best Practices (WHY)

1. **Limit Template Count to 3-5 (Why):** Each template requires ongoing maintenance—Laravel version upgrades, package updates, tooling changes. A template that's not maintained becomes a liability. A focused catalog of 3-5 templates (standard API, monolith, package library, queue worker) covers 80% of use cases without fragmentation.

2. **Test All Templates in CI (Why):** Untested templates produce broken projects that erode developer trust in the platform. Every template must have automated CI that creates a project from the template, runs all quality tools, and verifies the generated application boots.

3. **Use Parameterization, Not Hardcoding (Why):** Use placeholders for all organization-specific values. Hardcoded team names, API keys, or domains create security risks and maintenance problems. Parameterized templates are reusable across teams and environments.

4. **Capture Post-Generation Fixes (Why):** When developers consistently add the same manual fixes after template generation, incorporate those fixes into the template. This closes the loop between template authors and users, continuously improving the template quality.

5. **Version Templates Independently (Why):** Templates evolve at their own pace, independent of the projects they generate. Template versions in generated project metadata enable upgrade tracking and impact analysis when templates change.

## Architecture Guidelines

- **Template Format:** Use directory trees with placeholder files. Blade syntax for parameter substitution (consistent with Laravel conventions). Post-generation scripts as Artisan commands.
- **Distribution Method:** Composer packages for parameterized templates (supports post-generation hooks). GitHub template repositories for simple skeletons.
- **Testing:** Each template has CI that: creates project from template → runs composer install → executes all quality tools → runs test suite → verifies application boots.
- **Registry Structure:** Maintain a catalog file (template.yaml per template) declaring: name, description, Laravel version compatibility, PHP version requirements, parameters, and dependencies.
- **Deprecation Policy:** When retiring a template, block new project generation from it, notify existing projects, and provide migration guidance to replacement templates.

## Performance

- **Template Rendering:** Generation should complete in under 2 seconds. Pre-compile templates where possible.
- **Dependency Installation:** The bottleneck is composer install + npm install. Use Composer cache and consider pre-populated vendor directories for common dependency sets.
- **Git Initialization:** Include git init + initial commit + remote push as part of template generation for clean history from day one.

## Security

- **No Secrets in Templates:** Never include API keys, tokens, or passwords in templates. Use environment variables and secret management.
- **Template Auditing:** All template changes go through code review. CI validates templates produce working projects. Security-sensitive templates (PCI, HIPAA) require additional review.
- **Dependency Scanning:** Regularly scan template composer.json for vulnerable dependencies. Update templates when CVEs affect included packages.
- **Supply Chain:** Sign template releases. Verify template integrity before distribution.

## Common Mistakes

### Mistake 1: Too Many Templates
- **Description:** Maintaining 10+ templates for every conceivable project type
- **Cause:** Desire to cover every edge case, lack of curation discipline
- **Consequence:** High maintenance burden, fragmented organizational practices, templates fall out of date
- **Better:** Maintain 3-5 actively used templates. Archive rarely-used templates. Encourage use of parameters within templates.

### Mistake 2: Untested Templates
- **Description:** Templates created without automated validation that generated projects work
- **Cause:** Time pressure, assumption that templates "just work"
- **Consequence:** Broken projects created from templates, developer frustration, platform distrust
- **Better:** CI pipeline for every template that creates a project and runs full validation suite

### Mistake 3: Outdated Templates
- **Description:** Templates based on EOL Laravel versions or outdated packages
- **Cause:** No scheduled update cadence, template maintenance not prioritized
- **Consequence:** Security debt from day one, developers must manually upgrade generated projects
- **Better:** Update templates within 2 weeks of Laravel version releases. Scheduled CI runs validate template compatibility.

### Mistake 4: No Post-Generation Experience
- **Description:** Template creates the project but the developer has no guidance on what to do next
- **Cause:** Focus on technical template generation, neglecting developer onboarding
- **Consequence:** Developers struggle after project creation, miss configured tools
- **Better:** Generated project includes README with setup instructions, development workflow docs, and first-commit guidance

## Anti-Patterns

- **The Monolith Template:** One massive template trying to cover every possible project type. Hard to maintain, confusing for developers. Split into focused templates with clear use cases.
- **The Frozen Template:** A template that hasn't been updated in 12+ months. Generates projects with outdated practices. Establish minimum update frequency (quarterly).
- **The Empty Template:** A template that only includes organizational config files but no project structure guidance. Developers still spend hours setting up the project. Include meaningful architectural decisions.
- **The Over-Parameterized Template:** 20+ parameters causing decision paralysis. Limit to 3-5 essential choices with sensible defaults.

## Examples

### Example 1: Basic Laravel API Template Structure
```
skeleton/
├── template.yaml (name, description, parameters, Laravel version)
├── {{ project_name }}/
│   ├── app/
│   │   ├── Http/
│   │   │   └── Controllers/
│   │   │       └── Api/
│   │   │           └── V1/
│   │   │               └── Controller.php
│   │   ├── Services/
│   │   └── DTOs/
│   ├── config/
│   │   └── api.php (API-specific config)
│   ├── pint.json
│   ├── phpstan.neon
│   ├── .github/workflows/ci.yml
│   ├── docker-compose.yml
│   └── README.md
└── post-generation.php
```

### Example 2: Template Registry CLI Flow
```
$ my-org:new
? Select template: (Use arrow keys)
  ▸ Laravel API (Pest, PHPStan, Sail, MySQL, Redis)
    Laravel Monolith (Blade, Livewire, Full stack)
    Laravel Package (Spatie tools, Testbench)
    Laravel Queue Worker (Horizon, Redis)
? Project name: my-service
? PHP version: 8.3
? Include starter kit: Breeze (API)
→ Generating project... (2 seconds)
→ Installing dependencies... (30 seconds)
→ Running post-generation scripts...
→ Project created at ./my-service
→ cd my-service && sail up
```

## Related Topics

- **golden-path-paved-road-patterns:** Templates as the foundation of golden paths
- **self-service-environment-provisioning:** Templates for environment provisioning
- **idp-architecture-patterns:** Template registries within the IDP architecture
- **stub-customization-laravel:** Customizing Laravel stubs for generated code
- **package-skeleton-structure:** Package skeletons as specialized templates

## AI Agent Notes

- **Context Requirements:** When advising on template registries, first determine the number of Laravel applications, current project creation process, and specific organizational standards that need encoding. Template design depends on existing architecture patterns.
- **Key Decision Points:** The critical choices are: (1) number of templates to maintain, (2) distribution method (Composer vs GitHub vs CLI), (3) template thickness (minimal vs opinionated), (4) parameterization approach. Each choice affects maintenance burden and developer experience.
- **Common Pitfalls in AI Assist:** Avoid recommending excessive template count. Don't suggest templates without testing strategies. Always consider the ongoing maintenance cost of each template.
- **Laravel-Specific Nuances:** Composer create-project is the natural distribution mechanism for Laravel templates. Blade syntax is preferred for template parameters (Laravel developers already know it). Spatie's package skeleton is the reference implementation for Laravel package templates.

## Verification

- [ ] KU correctly defines internal template registries and their role in Laravel IDPs
- [ ] Core concepts are complete and accurate
- [ ] When To Use / When NOT To Use provides clear decision framework
- [ ] Best practices are justified and actionable
- [ ] Architecture guidelines cover format, distribution, testing, and deprecation
- [ ] Performance targets are quantified
- [ ] Security addresses secrets, auditing, and dependency scanning
- [ ] Common Mistakes include cause/consequence/better for each
- [ ] Anti-patterns are clearly identified
- [ ] Examples show realistic template structure and CLI flow
- [ ] Related topics cross-reference is accurate
- [ ] AI Agent Notes provide actionable guidance
