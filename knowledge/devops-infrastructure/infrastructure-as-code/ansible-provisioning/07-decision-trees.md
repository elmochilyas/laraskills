# Decision Trees: Ansible Provisioning

## Provisioning Approach

**Existing servers to manage?**
- Yes, existing servers → Ansible (agentless, works with existing SSH)
- New infrastructure → Terraform for provisioning + Ansible for config

**Scale:**
- 1-5 servers → Forge/Ploi may be simpler
- 5-50 servers → Ansible provides good balance of control and simplicity
- 50+ servers → Ansible + Packer for golden images
