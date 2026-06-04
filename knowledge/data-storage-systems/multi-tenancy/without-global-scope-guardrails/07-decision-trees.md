# 5-12 Without Global Scope Guardrails - Decision Trees

## Permitted vs Prohibited Scope Bypass

---

## Decision Context

Determining when `withoutGlobalScope` is justified (admin operations, system maintenance) versus prohibited (user-facing features).

---

## Decision Criteria

* performance: bypassing scope changes query result set — may return many more rows
* architectural: every bypass is a security control point
* maintainability: annotate each bypass with issue number and reason
* security: bypasses must be gated by authorization

---

## Decision Tree

Should you use withoutGlobalScope?

↓

Is the caller an admin or system command?

YES → Is the operation reading data across tenants?

    YES → Permitted with annotation
        
        ↓
        Model::withoutGlobalScope('tenant')
            ->where(...)
            ->get();
        // @tenant-escape: ISSUE-1234 — cross-tenant admin report
        
        ↓
        Must verify: current user has admin role
        Must verify: purpose is legitimate (report, export, maintenance)
        Must verify: result is never exposed to non-admin users
        
    NO → Single-tenant operation that doesn't need scope?
    
        → Use ->withoutAppending() or explicit query
        Avoid unnecessary scope bypasses

NO → User-facing feature?

    YES → PROHIBITED
        
        ↓
        Do NOT bypass scope for:
        - Dashboard widgets
        - API endpoints
        - User-facing search
        - Feature queries
        
        ↓
        Instead: design feature to work within tenant scope
        Use relationships, joins, or admin-only endpoints

NO → Unsure?

    → Default to NOT bypassing
    If you're questioning it, the answer is no
    Request review from security team

---

## Recommended Default

**Default:** Do NOT use withoutGlobalScope for any user-facing code path
**Reason:** Each bypass is a potential leak. The friction of getting approval forces developers to find tenant-safe alternatives.

---

## Logging and Monitoring Scope Bypasses

---

## Decision Context

Implementing observability for `withoutGlobalScope` calls to detect unexpected bypasses and provide audit trail.

---

## Decision Criteria

* performance: logging adds minimal overhead per bypass call
* architectural: centralized bypass tracking enables alerting
* maintainability: custom macro wraps bypass with automatic logging
* security: unexpected bypasses trigger immediate alerts

---

## Decision Tree

How to monitor scope bypasses?

↓

Use a custom macro that logs every bypass?

YES → Implement TenantScoped::withoutGlobalScopeFor()

    ↓
    Model::withoutGlobalScopeFor('tenant', function ($query) {
        // bypass logic
    }, 'ISSUE-1234: admin report');
    
    ↓
    Macro automatically:
    1. Logs caller file + line + reason
    2. Records current user ID
    3. Sends to monitoring system
    4. Alerts if unexpected frequency

NO → Manual annotation only?

    → Rely on code review
    Accept: no runtime monitoring
    Higher risk: bypasses may go undetected
    Only acceptable for very small teams

NO → CI enforcement?

    → Static analysis: grep for withoutGlobalScope
    Fail CI if no annotation comment on same line
    Not a replacement for runtime monitoring

---

## Recommended Default

**Default:** Custom macro with automatic logging + CI annotation enforcement
**Reason:** Runtime logging catches unexpected usage. CI enforcement prevents unannotated bypasses from reaching production.

---

## Related Rules

* Rule 5-12-1: Use withoutGlobalScope Guardrails
* Rule 5-11-1: Implement Isolation Testing

---

## Related Skills

* Implement Cross-Tenant Data Leak Prevention
* Implement withoutGlobalScope Guardrails
