# Anti-Patterns: Ansible Packer

## AP-AP-001: Stale Golden Images
**Description:** Using 6-month-old golden images for auto-scaling.
**Consequences:** New instances launch with known vulnerabilities. Patches deployed after image creation are not included.
**Remediation:** Automate weekly image rebuilds. Use CI/CD pipeline to build on schedule.

## AP-AP-002: Manual Image Baking
**Description:** Building golden images manually through the cloud console.
**Consequences:** Images are not reproducible. Disaster recovery requires recreating manual steps.
**Remediation:** All image builds must go through automated Packer pipeline.
