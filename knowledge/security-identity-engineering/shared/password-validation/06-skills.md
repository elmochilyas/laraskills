# Skill: Implement Secure Password Validation Rules

## Purpose
Configure password complexity and strength validation using Laravel's built-in validation rules and `zxcvbn` or similar entropy-based strength estimation for secure user passwords.

## When To Use
- User registration and password change forms
- Admin user creation
- Password reset flows
- Compliance requiring minimum password strength

## When NOT To Use
- Passwordless authentication (passkeys, WebAuthn)
- OAuth-only applications where password is not used
- Internal development environments

## Prerequisites
- Laravel validation system
- Password strength package (optional: `bjeavons/zxcvbn-php`)

## Workflow
1. Validate minimum length: `'password' => 'required|min:8'`
2. Validate mixed case: `'regex:/[a-z]/', 'regex:/[A-Z]/'`
3. Validate numbers: `'regex:/[0-9]/'`
4. Validate special characters: `'regex:/[@$!%*#?&]/'`
5. Use `confirmed` rule for password confirmation fields
6. Optional: integrate `zxcvbn-php` for entropy-based strength scoring
7. Never use `max` validation on passwords (encourages weak truncation)
8. Never store passwords in plaintext — always bcrypt hash
9. Return specific, user-friendly error messages for each rule

## Validation Checklist
- [ ] Minimum 8 characters enforced
- [ ] Mixed case required (lowercase + uppercase)
- [ ] At least one number required
- [ ] At least one special character required
- [ ] Password confirmation field validated
- [ ] No max-length restriction on passwords
- [ ] Password hashed with bcrypt before storage
- [ ] User-friendly error messages for validation failures
