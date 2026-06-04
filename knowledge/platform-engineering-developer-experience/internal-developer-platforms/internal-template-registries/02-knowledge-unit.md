# Knowledge Unit: Internal Template Registries (Laravel Project Templates)

## Metadata
- **Subdomain:** Internal Developer Platforms (IDP)
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** internal-developer-platforms-idp/internal-template-registries
- **Maturity:** Maturing
- **Related Technologies:** Laravel Installer, Composer create-project, GitHub Templates, Cookiecutter, custom installer packages

## Executive Summary

Internal template registries are curated collections of Laravel project skeletons that encode organizational standards—PHP version, code style configuration (pint.json), static analysis setup (phpstan.neon), CI pipelines, Docker Compose services, deployment scripts, and starter kit selections. Teams choose a template when creating a new project, ensuring every Laravel application starts with compliant tooling and configuration. Templates range from minimal (bare Laravel installer) to opinionated (full microservice skeleton with API scaffolding, DTOs, repositories, and service layer patterns). The registry is typically distributed via composer packages, Git repositories, or CLI tools.

## Core Concepts

- **Project Skeleton:** A pre-configured Laravel application directory structure with organization-specific tooling, configuration files, and documentation templates
- **Template Parameterization:** Templates accept parameters (project name, starter kit, database type, PHP version) and generate customized output via placeholders
- **Template Registry:** A catalog of available templates with metadata (purpose, Laravel version, services included, recommended for) accessible via CLI or portal
- **Template Versioning:** Templates are versioned independently from the projects they generate; each template version is compatible with specific Laravel versions

## Mental Models

- **Template as a Seed:** A project template is like a seed—it determines the initial structure and characteristics of what grows, but the project will evolve independently
- **Template Registry as a Menu:** Developers browse the registry like a menu, selecting the template that best fits their project type (API, monolith, package, queue worker)
- **Template as a Contract:** Each template encodes organizational standards and guarantees a minimum baseline of tooling, security, and quality practices
- **Template Evolution as Gardening:** Templates need regular care—pruning dead branches (deprecated packages), fertilizing (new tooling), and occasionally replanting (new Laravel versions)

## Internal Mechanics

1. **Template Definition:** A template is a directory tree with files containing placeholders (e.g., `{{ project_name }}`, `{{ php_version }}`). A configuration file (e.g., `template.yaml`) declares parameters, post-generation scripts, and metadata.
2. **Template Rendering:** On project creation, the renderer: copies template files → substitutes placeholders → runs post-generation scripts (e.g., `composer install`, `php artisan key:generate`, `git init`) → returns the generated project.
3. **Template Distribution:** Templates are distributed via: Git repositories (GitHub template repos), Composer packages (the template as a package with a custom installer), or CLI tools (custom `laravel new` wrapper).
4. **Template Discovery:** Developers discover templates through: CLI command (`my-org:new`), developer portal UI (Backstage scaffolder), or documentation listing template options with descriptions.

## Patterns

- **Base + Overlay Pattern:** Maintain a "base" template (the organization's minimal Laravel configuration) and overlay templates that add specific functionality (base + API toolkit, base + admin panel, base + queue worker).
- **Feature Flags in Templates:** Template parameters (boolean or enum) that conditionally include features: `auth: breeze`, `testing: pest`, `deployment: forge`. Generated project includes only selected features.
- **Template Testing Pattern:** Each template has an automated CI pipeline that: creates a project from the template, runs all quality tools (Pint, PHPStan, tests), and verifies the generated application boots.
- **Template Changelog Pattern:** Maintain a `CHANGELOG.md` for each template documenting changes between versions; template version is recorded in generated projects for upgrade tracking.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Template format | Directory + placeholders vs Cookiecutter vs custom | Custom for Laravel-specific needs; Cookiecutter for simplicity |
| Parameter substitution | PHP-based (str_replace) vs Twig vs Blade syntax | Blade syntax for consistency with Laravel conventions |
| Distribution method | GitHub templates vs Composer package vs CLI tool | Composer package for parameterized templates; GitHub for simple skeletons |
| Post-generation script | Bash vs Artisan command vs Composer scripts | Artisan command for Laravel-specific post-generation tasks |

## Tradeoffs

- **Standardization vs Flexibility:** More opinionated templates ensure consistency but may not fit all project needs. A registry approach (multiple templates for different use cases) balances standardization with flexibility.
- **Template Maintenance Burden:** Each template requires ongoing maintenance—Laravel version upgrades, package updates, tooling changes. A template that's not maintained becomes a liability. Limit the template catalog to 3-5 actively maintained options.
- **Thick vs Thin Templates:** Thick templates include application architecture decisions (DTOs, repositories, service layer) which saves time but imposes architectural choices. Thin templates (minimal configuration only) preserve developer freedom but require more setup.
- **Simple Placeholders vs Complex Logic:** Simple string substitution is easy to implement but limited. Template engines (Blade, Twig) enable complex logic (conditionals, loops, includes) but add learning curve.

## Performance Considerations

- **Template Rendering Speed:** Template generation should complete in under 2 seconds; slow rendering frustrates developers. Pre-compile templates where possible and cache generated output.
- **Dependency Installation:** The slowest part of project creation is `composer install` and `npm install`. Use Composer's cache and consider pre-populated vendor directories for common dependency sets.
- **Git Initialization:** `git init` + initial commit should be part of template generation; this establishes clean git history from the start. Consider also pushing to a remote repository as part of the generation flow.

## Production Considerations

- **Template Compatibility:** Templates must specify compatible Laravel and PHP versions; prevent project generation with incompatible combinations through validation in the template renderer.
- **Template Deprecation:** When a template is deprecated (e.g., based on an EOL Laravel version), prevent new projects from using it and notify existing projects of migration path.
- **Template Auditing:** All template changes should go through code review; automated CI validates that templates produce working projects; security-sensitive templates (PCI, HIPAA) require additional review.
- **Template Metrics:** Track which templates are used most, which parameters are customized most often, and which post-generation steps take the longest—use data to optimize the most-used templates.

## Common Mistakes

- **Too many templates:** Each template increases maintenance burden and fragments organizational practices; maintain 3-5 max and encourage with strong defaults
- **Templates without testing:** Untested templates produce broken projects; every template must have automated CI that creates a project and verifies it works
- **Hardcoding values in templates:** Use parameters for all organization-specific values; hardcoded values (team names, API keys, domains) create security risks and maintenance problems
- **Outdated templates:** A template based on Laravel 9 when the organization has moved to Laravel 11 creates security debt from day one; update templates within 2 weeks of Laravel version releases
- **Ignoring the post-generation experience:** Template generation is just the beginning; the generated project should include clear README, setup instructions, and development workflow docs

## Failure Modes

- **Template Rot:** Templates become incompatible with current Laravel versions, packages, or infrastructure. Mitigate: scheduled CI runs that regenerate projects from templates and run full validation.
- **Template Proliferation:** Teams create ad-hoc templates outside the registry, fragmenting organizational standards. Mitigate: make the official template registry easy to access and contribute to.
- **Parameter Explosion:** Too many template parameters create decision paralysis and reduce reproducibility. Mitigate: limit parameters to essential choices; use sensible defaults for everything else.
- **Post-Generation Manual Fixes:** Developers consistently add the same manual fixes after template generation. Mitigate: capture these fix patterns and incorporate them into the template, closing the loop between template authors and users.

## Ecosystem Usage

- **Laravel Installer:** The official `laravel new` command; supports optional starter kits via `--breeze`, `--jetstream`, `--livewire` flags; extensible via custom installer packages
- **GitHub Template Repositories:** GitHub-native template mechanism; create project from template button; limited parameterization (no placeholders support natively)
- **Composer create-project:** `composer create-project laravel/laravel` is the foundation; custom project skeletons can be distributed as Composer packages
- **Spatie Package Skeleton Laravel:** The reference implementation for Laravel package templates; includes PHP-CS-Fixer, PHPStan, GitHub Actions, and Testbench configuration
- **Backstage Scaffolder:** Supports template parameterization with Nunjucks templating; integrates with Git providers and CI/CD systems for end-to-end project creation

## Related Knowledge Units

- golden-path-paved-road-patterns
- self-service-environment-provisioning
- idp-architecture-patterns
- custom-artisan-make-commands
- stub-customization-laravel

## Research Notes

- GitHub template repositories are the most common distribution mechanism for Laravel project templates due to zero additional tooling requirements
- Organizations with mature platform engineering practices maintain 3-5 templates covering: standard API, monolith, package library, and queue worker patterns
- The Laravel community lacks a standardized template registry format (unlike Cookiecutter in Python or yeoman in Node.js), leading to ad-hoc implementations
- Template testing is the most commonly neglected aspect; a broken template damages developer trust in the platform team significantly more than the absence of a template
- The trend in 2025 is toward "template-as-code" where template changes go through the same CI/CD pipeline as application code, with automated validation of generated projects
