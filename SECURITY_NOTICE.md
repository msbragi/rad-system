# ⚠️ SECURITY NOTICE - ACTION REQUIRED

## Critical Security Update

**Date**: February 3, 2026

`.env` files containing sensitive credentials were previously committed to this repository's git history.

## Immediate Actions Required

### For Repository Owner:
1. **READ**: `SECURITY_CLEANUP_GUIDE.md` for complete history cleanup instructions
2. **ROTATE ALL CREDENTIALS** listed in the guide immediately
3. **Follow cleanup steps** to remove .env files from git history
4. **Notify all collaborators** to re-clone after cleanup

### For Developers:
1. **After history cleanup**: Delete your local clone and re-clone the repository
2. **Setup environment**: Copy `.env.example` to `.env` and get credentials from team
3. **Never commit** .env files (they are now in .gitignore)

## Files Affected
- `Docker/.env` - Removed from tracking
- `rad-be/.env` - Removed from tracking
- Both files remain in git history until cleanup is complete

## Getting Started After Cleanup

1. Clone the repository:
   ```bash
   git clone https://github.com/msbragi/rad-system.git
   ```

2. Copy environment templates:
   ```bash
   cp Docker/.env.example Docker/.env
   cp rad-be/.env.example rad-be/.env
   ```

3. Request credentials from your team lead and update the .env files

4. Verify .env files are not tracked:
   ```bash
   git status
   # .env files should NOT appear in untracked files
   ```

## Security Best Practices

- ✅ Use `.env.example` as templates (safe to commit)
- ✅ Keep `.env` files only on local machines
- ✅ Store production secrets in secure vaults (e.g., AWS Secrets Manager, Azure Key Vault)
- ✅ Rotate credentials regularly
- ❌ Never commit `.env` files to git
- ❌ Never share credentials via email, Slack, or other unsecured channels

## Questions?

Contact the repository owner or security team if you have questions about this security update.

---

**Status**: 
- [x] .env files removed from current branch
- [ ] Git history cleanup (requires force push - owner action)
- [ ] Credentials rotated (requires owner action)
- [ ] Team notified (requires owner action)
