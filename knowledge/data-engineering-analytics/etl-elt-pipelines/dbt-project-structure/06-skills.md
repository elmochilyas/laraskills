# Skills: dbt Project Structure for Medallion Architecture with Tests

## Skill: Organizing a dbt Project by Layer and Domain
**Purpose:** Set up a maintainable dbt project structure following medallion architecture conventions.
**When to use:** Initializing a new dbt project or restructuring an existing one.
**Steps:**
1. Create `models/staging/<source>/` directories for each data source
2. Create `models/intermediate/<domain>/` directories for business logic
3. Create `models/marts/<domain>/` directories for business-specific marts
4. Create `staging/sources.yml` with source definitions and freshness configs
5. Add `_staging_models.yml`, `_intermediate_models.yml`, `_marts_models.yml` per directory
6. Configure default materializations in `dbt_project.yml` per directory path
7. Add `freshness` blocks to all production sources
8. Add tests (unique, not_null, relationships) for all model primary keys

## Skill: Enforcing dbt Project Conventions
**Purpose:** Ensure consistent naming, testing, and documentation across a dbt project.
**When to use:** Scaling a dbt project across multiple team members.
**Steps:**
1. Document naming conventions in CONTRIBUTING.md
2. Add dbt-codegen analysis to review existing conventions
3. Create custom generic tests for project-specific conventions
4. Configure dbt pre-commit hooks for YAML linting and naming checks
5. Add CI pipeline step that runs `dbt list --resource-type model` to verify naming
6. Review model documentation quarterly for completeness
