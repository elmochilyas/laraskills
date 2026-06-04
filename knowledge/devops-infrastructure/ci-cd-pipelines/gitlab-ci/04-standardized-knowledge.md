# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 03-ci-cd-pipelines
**Knowledge Unit:** gitlab-ci
**Difficulty:** Intermediate
**Category:** CI/CD Pipelines
**Last Updated:** 2026-06-03

# Overview

GitLab CI is the primary alternative to GitHub Actions for Laravel CI/CD, preferred by teams already using GitLab for repository hosting. Pipelines are defined in `.gitlab-ci.yml` with stages (test, build, deploy) and jobs that run on GitLab Runners. Features include Docker-in-Docker (DIND) for building container images, environment-specific variables, multi-project pipelines, and built-in container registry.

GitLab CI exists as the integrated CI/CD solution for GitLab repositories. The engineering value is a single platform for source control and CI/CD with native GitLab integration.

# When To Use

- Code hosted on GitLab repositories
- Self-managed CI/CD with GitLab Runner
- Docker-native build pipelines requiring DIND
- Multi-project pipelines across microservices

# When NOT To Use

- Code hosted on GitHub (use GitHub Actions)
- Teams without GitLab Runner maintenance capability
- Simple pipelines that don't benefit from GitLab CI's advanced features

# Best Practices

**Use GitLab Container Registry.** Store Docker images in GitLab's built-in registry for tight integration.

**Cache Effectively.** Key caches on lock file checksums for automatic invalidation.

**Mask All Secrets.** Use GitLab CI/CD masked variables for tokens and passwords.

**Use YAML Anchors.** Reduce duplication across stages with `.job-template` anchors.

# Common Mistakes

**Privileged DIND Mode.** Running Docker-in-Docker in privileged mode unnecessarily. Use Kubernetes runners or kaniko for secure builds.

**No Cache Configuration.** Pipelines without caching download dependencies on every run.

**Hardcoded Environment Names.** Using literal environment names in deploy jobs instead of CI/CD variables.

# Related Topics

**Prerequisites:** GitLab, Docker basics
**Closely Related:** GitHub Actions, Pipeline Structure, DIND Patterns
**Advanced Follow-Ups:** GitLab Kubernetes Integration, Multi-Project Pipelines
**Cross-Domain Connections:** Container Registry, Containerization
