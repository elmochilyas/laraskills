# Skill: Rotate Encryption Keys Without Data Loss

## Purpose
Execute a secure key rotation process for Laravel's APP_KEY, RSA encryption keys, and KMS master keys, ensuring all existing encrypted data is transitioned to new keys without data loss.

## When To Use
- Scheduled key rotation (compliance requirement: annual or semi-annual)
- Key compromise or suspected exposure
- Staff changes (developers with key access leave)
- Migration to stronger key algorithms

## When NOT To Use
- Frequent unnecessary rotation (increases risk of data loss)
- Without testing the rotation process first on a staging environment

## Prerequisites
- Understanding of which data is encrypted with which keys
- Backup of old keys (encrypted, stored securely)
- Access to all encrypted data that needs re-encryption

## Workflow
1. Document all keys in use: APP_KEY, RSA key pairs, KMS keys, DEKs
2. For APP_KEY rotation: decrypt ALL encrypted data using old key, re-encrypt with new key
3. For RSA key rotation: decrypt all columns with old private key, re-encrypt with new public key
4. For KMS/KEK rotation: re-wrap all DEKs with new KEK (no data re-encryption needed)
5. Maintain access to old keys during transition period for data not yet re-encrypted
6. Destroy old keys only after confirming all data successfully re-encrypted
7. Update all environment configurations with new keys
8. Test decryption of all data types after rotation

## Validation Checklist
- [ ] All data successfully decrypted with new keys
- [ ] Old keys backed up securely before destruction
- [ ] Transition period maintained for data not yet re-encrypted
- [ ] Key rotation tested on staging before production
- [ ] No data loss after rotation verified
