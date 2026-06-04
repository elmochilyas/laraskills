# Skills: Ansible Packer

## Skill: golden-image-pipeline
**Purpose:** Create automated golden image pipeline with Ansible + Packer
**Trigger:** When building immutable server images for auto-scaling
**Workflow:**
1. Write Ansible playbooks for server configuration
2. Create Packer template referencing playbook
3. Configure CI/CD to build image on playbook changes
4. Tag image with version information
5. Test image by launching instance
6. Publish to production AMI/VM list
7. Schedule weekly rebuilds for security patches
**Output:** Automated golden image pipeline with CI/CD integration
