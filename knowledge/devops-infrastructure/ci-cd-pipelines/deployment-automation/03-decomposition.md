# Decomposition: GitLab CI for Laravel

## Topic Overview
GitLab CI is the primary alternative to GitHub Actions for Laravel CI/CD, preferred by teams already using GitLab for repository hosting. Pipelines are defined in `.gitlab-ci.yml` with stages (test, build, deploy) and jobs that run on GitLab Runners. GitLab CI features include Docker-in-Docker (DIND) for building container images, environment-specific variables, multi-project pipelines, and built-in container registry.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
deployment-automation/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### GitLab CI for Laravel
- **Purpose:** GitLab CI is the primary alternative to GitHub Actions for Laravel CI/CD, preferred by teams already using GitLab for repository hosting.
- **Difficulty:** Intermediate
- **Dependencies:** GitHub Actions CI/CD (KU-008) — primary alternative, Docker-in-Docker patterns (cross-domain), Laravel Forge Provisioning (KU-001) — Forge API integration, Kubernetes for Laravel (KU-013) — GitLab CI + K8s deployment

## Dependency Graph
**Depends on:**
- GitHub Actions CI/CD (KU-008) — primary alternative
- Docker-in-Docker patterns (cross-domain)
- Laravel Forge Provisioning (KU-001) — Forge API integration
- Kubernetes for Laravel (KU-013) — GitLab CI + K8s deployment

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Stages, jobs, runners
- Docker executor and DIND
- Environment-based deployment
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- GitHub Actions CI/CD (KU-008) — primary alternative, Docker-in-Docker patterns (cross-domain), Laravel Forge Provisioning (KU-001) — Forge API integration, Kubernetes for Laravel (KU-013) — GitLab CI + K8s deployment

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization
