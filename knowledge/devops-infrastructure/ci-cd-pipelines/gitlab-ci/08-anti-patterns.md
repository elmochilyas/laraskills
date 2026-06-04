# Anti-Patterns: GitLab CI

## AP-GITLAB-001: Privileged DIND for Everything
**Description:** Running all Docker jobs in privileged DIND mode as default.
**Consequences:** Any job that runs in the pipeline has elevated privileges. A compromised job gains host-level access.
**Remediation:** Use kaniko or buildah for Docker builds. Reserve DIND for jobs that require it.

## AP-GITLAB-002: The `.gitlab-ci.yml` Monolith
**Description:** One file with hundreds of lines, no includes, no anchors.
**Consequences:** Pipeline configuration is unreadable. Reuse across projects requires copy-paste.
**Remediation:** Use YAML anchors for reusable blocks. Use `include` for shared pipeline components.
