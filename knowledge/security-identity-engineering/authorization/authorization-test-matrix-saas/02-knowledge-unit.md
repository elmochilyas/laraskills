# Metadata

Domain: Security & Identity Engineering
Subdomain: Authorization
Knowledge Unit: SaaS authorization test matrix for roles and entitlements
Difficulty Level: Advanced
Last Updated: 2026-06-22

---

# Executive Summary

SaaS authorization testing requires a combinatorial matrix: user not in team, viewer, member, admin, owner, right role but wrong plan, right plan but wrong role, platform admin, and cross-team isolation. Each protected action must be tested against every relevant axis to prevent authorization bugs that silently require payment plan upgrades.
