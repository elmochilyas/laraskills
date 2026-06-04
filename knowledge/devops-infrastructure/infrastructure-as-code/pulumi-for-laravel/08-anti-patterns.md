# Anti-Patterns: Pulumi for Laravel

## AP-PULUMI-001: Pulumi Without Preview
**Description:** Running `pulumi up` directly without reviewing `pulumi preview` output.
**Consequences:** Unexpected resource deletion. Pipeline runs unreviewed infrastructure changes.
**Remediation:** Always run preview and require manual approval for production environments.

## AP-PULUMI-002: Complex Logic in IaC
**Description:** Overusing programming constructs in Pulumi to create infrastructure that is difficult to understand.
**Consequences:** Infrastructure definition becomes as complex as application code. The simplicity of declarative IaC is lost.
**Remediation:** Use programming constructs judiciously. Prefer reusable components over inline logic.
