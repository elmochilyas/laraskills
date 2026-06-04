# Decision Trees: Ansible Packer

## Image Strategy

**Auto-scaling used?**
- Yes → Golden images reduce instance startup time from 10min to 30s
- No → Provisioning from scratch is acceptable

**Image rebuild frequency:**
- Weekly → Critical for security; automated pipeline recommended
- Monthly → Acceptable for low-risk environments
- Per-change overhead → Build images only when playbooks change
