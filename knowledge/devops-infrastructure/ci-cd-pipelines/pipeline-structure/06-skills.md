# Skills: Pipeline Structure

## Skill: ci-pipeline-design
**Purpose:** Design a CI/CD pipeline structure for Laravel
**Trigger:** When establishing CI/CD process for new project
**Workflow:**
1. Define stages (lint, static analysis, test, build, deploy, post-deploy)
2. Identify fast-feedback stages (lint, static analysis)
3. Design parallel execution where possible
4. Configure triggers per stage (branch-based triggers)
5. Plan caching strategy per stage
6. Define artifact passing between stages
7. Set up environment promotion gates
**Output:** Pipeline structure diagram with stage dependency graph

## Skill: pipeline-quality-gate-setup
**Purpose:** Configure quality gates for deployment pipeline
**Trigger:** When enforcing deployment prerequisites
**Workflow:**
1. Identify minimum quality criteria (tests pass, lint clean, PHPStan pass)
2. Configure mandatory quality gates per stage
3. Set up deployment approval rules for production
4. Document quality gate exceptions process
5. Monitor gate failure rates
**Output:** Quality gate configuration with documented exception process
