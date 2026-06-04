# Anti-Patterns: Envoyer

## AP-ENVOYER-PLATFORM-001: Manual Only Deployments
**Description:** Clicking "Deploy" in Envoyer dashboard for every deployment.
**Consequences:** No deployment audit trail. CI/CD quality gates bypassed. Human error in deployment process.
**Remediation:** Trigger all deployments from CI/CD pipeline via Envoyer API.
