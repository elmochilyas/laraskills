# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 07-infrastructure-as-code
**Knowledge Unit:** ansible-packer
**Difficulty:** Advanced
**Category:** Infrastructure as Code
**Last Updated:** 2026-06-03

# Overview

Ansible + Packer combines configuration management (Ansible) with golden image creation (Packer) to create reproducible, hardened server images. Ansible playbooks configure the server state; Packer builds those playbooks into AMIs or VM images for instant provisioning.

This combination exists because provisioning servers from scratch takes 5-15 minutes per server. The engineering value is pre-baked, hardened images that launch in seconds with consistent configuration.

# When To Use

- Large-scale fleets where provisioning time matters
- Auto-scaling groups requiring instant server readiness
- Compliance requirements for pre-audited server images

# When NOT To Use

- Small fleets where provisioning time is acceptable
- Docker-based architectures (container images replace server images)

# Best Practices

**Version Image Builds.** Tag images with commit SHA and build timestamp.

**Build Regularly.** Rebuild images weekly to include security patches.

**Test Images.** Launch test instances from new images before production rollout.

**Keep Playbooks Separate.** Maintain Ansible playbooks independently of Packer.

# Related Topics

**Prerequisites:** Ansible basics, Packer basics
**Closely Related:** Ansible Provisioning, Terraform, Server Provisioning
**Advanced Follow-Ups:** Immutable Infrastructure, GitOps for Images
