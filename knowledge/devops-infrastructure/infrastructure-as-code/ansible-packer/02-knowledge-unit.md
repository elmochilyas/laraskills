# Ansible + Packer

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** Infrastructure as Code
- **Knowledge Unit:** Ansible + Packer
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary

Ansible + Packer combines configuration management (Ansible) with golden image creation (Packer) to create reproducible, hardened server images. Ansible playbooks define server state; Packer builds those playbooks into AMIs or VM images that launch in seconds with consistent configuration, eliminating the 5-15 minute provisioning wait per server.

---

## Core Concepts

- **Golden Image** — Pre-baked server image with all required software and configuration
- **Immutable Infrastructure** — Servers are never modified after launch; updates deploy new images
- **Packer Build** — Automated process that launches a temporary instance, runs Ansible, and captures the result as an image
- **Ansible Provisioner** — Packer uses Ansible playbooks to configure the temporary instance
- **Versioned Images** — Images tagged with commit SHA and build timestamp for traceability

---

## Mental Models

- **Bake, Don't Cook** — Instead of provisioning each server individually (cooking), bake all configuration into a golden image (baking). Server launch is just reheating — instant and consistent.
- **Immutable Server** — Once an image is built and deployed, it is never modified. Updates come from new images, not from SSH-ing into running servers.
- **Configuration as Image Layer** — Ansible playbooks define what goes into the image. Packer captures the result as a deployable artifact. The playbooks are the source of truth; the image is a snapshot.

---

## Internal Mechanics

Packer uses a builder (e.g., `amazon-ebs`) to launch a temporary EC2 instance with the base OS AMI. It connects to the instance, copies the Ansible playbooks and configuration files, and runs `ansible-playbook` to apply configuration (install PHP, Nginx, configure settings, harden security). After Ansible completes, Packer stops the instance and creates an AMI from the attached EBS volume. The temporary instance is terminated. The resulting AMI can be launched in seconds to create pre-configured, hardened servers.

---

## Patterns

- **Version Image Builds** — Tag images with commit SHA and build timestamp for traceability and rollback
- **Build Regularly** — Rebuild images weekly to include security patches and OS updates
- **Test Images** — Launch test instances from new images before production rollout to verify functionality
- **Keep Playbooks Separate** — Maintain Ansible playbooks independently of Packer configuration for reuse with existing servers

---

## Architectural Decisions

- **Ansible+Packer vs. Forge/Ploi** — Use Ansible+Packer for large-scale fleets and auto-scaling groups needing instant readiness; use Forge/Ploi for smaller deployments where provisioning time is acceptable
- **Golden Image vs. Configuration Management** — Use golden images when launch speed is critical; use configuration management (Ansible alone) when image rebuild frequency is low
- **AMI vs. Docker Image** — Use AMI for EC2-based deployments; use Docker images for container-based deployments

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Instant server launch (seconds vs. minutes) | Image rebuild maintenance | Must rebuild regularly for security patches |
| Consistent, pre-audited server configuration | Image storage costs | Multiple image versions consume storage |
| Ideal for auto-scaling groups | Less flexibility for per-server customization | Each server is identical at launch |
| Version-controlled, auditable builds | Build pipeline maintenance | CI/CD must accommodate image building |

---

## Performance Considerations

Image build time includes instance launch, Ansible provisioning, and AMI creation — typically 10-30 minutes. Launching from a golden image takes 30-60 seconds instead of 5-15 minutes for fresh provisioning. Image storage costs scale with number of versions retained. Weekly rebuilds ensure images have recent security patches. Test launches before production deployment add pipeline time.

---

## Production Considerations

Automate image builds in CI/CD with weekly rebuild schedules. Integrate security scanning into the image build pipeline. Store images in a central registry (AWS EC2 console, shared AMIs). Implement image lifecycle policies to clean up old versions. Document the image build process for disaster recovery. Use image tags that can be traced back to the build commit.

---

## Common Mistakes

- **Not Rebuilding Regularly** — Images built once and used for months accumulate security vulnerabilities. Rebuild on a weekly schedule.
- **Skipping Image Testing** — Deploying untested images to production. Always launch and verify a test instance before production rollout.
- **Missing .ansible in Packer** — Ansible playbooks not included in the Packer build context, causing build failure. Ensure correct path configuration.
- **No Image Versioning** — Cannot determine which version is deployed, making rollback and audit impossible.

---

## Failure Modes

- **Build Failure** — Packer build fails during Ansible provisioning. Detection: build pipeline fails. Mitigation: fix Ansible playbook or Packer configuration, test build independently.
- **Stale Image Deployed** — Auto-scaling group launches an old image with known vulnerabilities. Detection: vulnerability scan reveals outdated packages. Mitigation: automate AMI updates in auto-scaling groups.
- **Image Compatibility Break** — Base OS AMI update breaks Ansible playbook compatibility. Detection: build pipeline fails with OS-specific errors. Mitigation: pin base AMI version, test with new base before switching.

---

## Ecosystem Usage

Ansible+Packer is used in Laravel environments requiring large-scale, consistent server fleets. Auto-scaling groups use pre-baked AMIs for instant scaling. Compliance requirements benefit from pre-audited images. The pattern complements Terraform (which manages infrastructure resources like VPC, subnets, security groups) by providing the compute images that Terraform-launched instances use.

---

## Related Knowledge Units

### Prerequisites
- Ansible basics, Packer basics

### Related Topics
- Ansible Provisioning
- Terraform
- Server Provisioning

### Advanced Follow-up Topics
- Immutable Infrastructure
- GitOps for Images

---

## Research Notes

Ansible+Packer provides instant server launch with consistent configuration. Use for large-scale fleets and auto-scaling groups. Version images with commit SHA and build timestamp. Rebuild weekly for security patches. Test images before production rollout. Keep Ansible playbooks separate from Packer configuration.
