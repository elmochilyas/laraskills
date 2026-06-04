# Skills: Ansible Provisioning

## Skill: ansible-laravel-playbook
**Purpose:** Create Ansible playbook for Laravel server provisioning
**Trigger:** When automating Laravel server setup with Ansible
**Workflow:**
1. Create inventory file with server groups
2. Create roles for PHP, Nginx, MySQL, Redis, Supervisor
3. Write tasks for package installation and configuration
4. Apply production PHP settings (OPcache, PHP-FPM tuning)
5. Configure Nginx site with Let's Encrypt SSL
6. Set up Supervisor for queue workers
7. Encrypt secrets with Ansible Vault
8. Test playbook idempotency
**Output:** Ansible playbook for reproducible Laravel server provisioning
