# Rules: Ansible Packer

## AP-001: Image Versioning
**Condition:** Packer builds server image
**Action:** Tag image with commit SHA and build timestamp
**Rationale:** Untagged images cannot be traced to source playbook version
**Consequences:** Violation makes image-to-playbook debugging impossible

## AP-002: Weekly Rebuilds
**Condition:** Golden image used for auto-scaling
**Action:** Rebuild image at least weekly to include security patches
**Rationale:** Images more than 30 days old deploy servers with known unpatched CVEs
**Consequences:** Violation provisions servers with outdated security patches

## AP-003: Image Testing Before Rollout
**Condition:** New image version built
**Action:** Launch test instance from image and verify full stack functionality
**Rationale:** Untested images may have broken configurations
**Consequences:** Violation deploys non-functional servers from bad images
