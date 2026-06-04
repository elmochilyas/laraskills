# Decomposition: ploi cli forge cli

## Topic Overview

Laravel Forge CLI and Ploi CLI are third-party command-line tools for managing Laravel server provisioning and deployment through their respective web services. Forge CLI (`forge-cli`) interacts with the Laravel Forge API to manage servers, sites, daemons, cron jobs, and deployments from the terminal. Ploi CLI provides similar functionality for the Ploi server management panel. Both tools enable developers to provision servers (DigitalOcean, AWS, Linode, Vultr, etc.), create sites, configure ...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
ploi-cli-forge-cli/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### ploi cli forge cli
- **Purpose:** Laravel Forge CLI and Ploi CLI are third-party command-line tools for managing Laravel server provisioning and deployment through their respective web services. Forge CLI (`forge-cli`) interacts with the Laravel Forge API to manage servers, sites, daemons, cron jobs, and deployments from the terminal. Ploi CLI provides similar functionality for the Ploi server management panel. Both tools enable developers to provision servers (DigitalOcean, AWS, Linode, Vultr, etc.), create sites, configure ...
- **Difficulty:** Foundation
- **Dependencies:** cli-workflow-automation, automated-deployment-pipelines, and github-actions-for-laravel

## Dependency Graph
**Depends on:** cli-workflow-automation, automated-deployment-pipelines, and github-actions-for-laravel
**Depended on by:** Knowledge units that leverage or extend ploi cli forge cli patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for ploi cli forge cli.
**Out of scope:** Adjacent topics covered in their own knowledge units; advanced or specialized use cases that extend beyond the core scope.

## Future Expansion Opportunities
None identified — the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization