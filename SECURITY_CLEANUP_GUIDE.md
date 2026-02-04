# Security Cleanup Guide - .env Files Removal

## Overview
This guide explains how to completely remove sensitive `.env` files from the git history of the rad-system repository.

## Current Status ✅
- `.env` files have been removed from git tracking in the current branch
- `.gitignore` has been updated to prevent future commits
- Files remain on disk for local development
- `.env.example` templates are available for reference

## Sensitive Data Exposed 🔴
The following credentials were found in the committed .env files and **MUST BE ROTATED**:

### rad-be/.env
- `JWT_SECRET`: [REDACTED - see original file]
- `MAIL_PASSWORD`: [REDACTED - compromised app password]
- `MAIL_USER`: [REDACTED - email address]
- `MAIL_BCC`: [REDACTED - email address]
- `GOOGLE_CLIENT_ID`: [REDACTED - OAuth client ID]
- `PGSQL_PASSWORD`: [REDACTED]

### Docker/.env
- `POSTGRES_USER`: [REDACTED]
- `POSTGRES_PASSWORD`: [REDACTED]
- `POSTGRES_DB`: [REDACTED]

## Complete History Cleanup Steps

### ⚠️ IMPORTANT WARNINGS
1. **This process rewrites git history** - all commit SHAs will change
2. **Force push is required** - this will affect all branches
3. **All collaborators must re-clone** the repository after cleanup
4. **Backup your repository** before proceeding

### Method 1: Using git-filter-repo (Recommended)

1. **Install git-filter-repo**:
   ```bash
   pip install git-filter-repo
   ```

2. **Create a fresh clone** (important):
   ```bash
   cd /tmp
   git clone --mirror https://github.com/msbragi/rad-system.git rad-system-cleanup
   cd rad-system-cleanup
   ```

3. **Remove .env files from all history**:
   ```bash
   git filter-repo --path Docker/.env --path rad-be/.env --invert-paths --force
   ```

4. **Force push to remote**:
   ```bash
   git push origin --force --all
   git push origin --force --tags
   ```

### Method 2: Using BFG Repo Cleaner (Alternative)

1. **Download BFG**:
   ```bash
   wget https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar
   ```

2. **Create a fresh mirror clone**:
   ```bash
   git clone --mirror https://github.com/msbragi/rad-system.git rad-system-cleanup.git
   ```

3. **Remove .env files**:
   ```bash
   java -jar bfg-1.14.0.jar --delete-files ".env" --no-blob-protection rad-system-cleanup.git
   cd rad-system-cleanup.git
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   ```

4. **Force push**:
   ```bash
   git push origin --force --all
   git push origin --force --tags
   ```

## Post-Cleanup Actions

### 1. Rotate ALL Credentials Immediately 🔴

#### JWT Secret
Update in `rad-be/.env`:
```bash
# Generate a new secure secret (256-bit recommended)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Email Password
1. Log into your Gmail account
2. Go to Security > 2-Step Verification > App passwords
3. Revoke the old compromised app password
4. Generate a new app password
5. Update `MAIL_PASSWORD` in `rad-be/.env`

#### Database Passwords
Update in both `Docker/.env` and `rad-be/.env`:
```bash
# Generate secure passwords
openssl rand -base64 32
```

#### Google OAuth (if private)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services > Credentials
3. Either:
   - Rotate the existing client secret, OR
   - Create a new OAuth 2.0 Client ID
4. Update `GOOGLE_CLIENT_ID` in `rad-be/.env`

### 2. Notify All Collaborators

Send this message to all team members:

```
Subject: Action Required - Repository Re-clone Needed

Hi Team,

We've cleaned up sensitive data from our git history. Please follow these steps:

1. Save any uncommitted work
2. Delete your local repository clone
3. Re-clone the repository: git clone https://github.com/msbragi/rad-system.git
4. Copy the new .env files from the team shared location
5. Verify everything works before continuing development

DO NOT force push or merge from old clones - this will reintroduce the sensitive data.

Thank you!
```

### 3. Update CI/CD and Environments

Update all environment variables in:
- GitHub Actions Secrets
- Docker deployments
- Production servers
- Staging environments
- Development environments

### 4. Consider Additional Security Measures

1. **Enable Branch Protection**:
   - Require pull request reviews
   - Enable status checks
   - Prevent force pushes to main/master

2. **Set up Pre-commit Hooks**:
   ```bash
   # Install git-secrets
   git clone https://github.com/awslabs/git-secrets.git
   cd git-secrets
   sudo make install
   
   # Configure for repository
   cd /path/to/rad-system
   git secrets --install
   git secrets --register-aws
   git secrets --add 'JWT_SECRET.*'
   git secrets --add 'MAIL_PASSWORD.*'
   ```

3. **Enable Secret Scanning**:
   - Go to repository Settings > Security > Secret scanning
   - Enable "Secret scanning" and "Push protection"

## Verification

After cleanup, verify no .env files remain in history:

```bash
git log --all --full-history --pretty=format:"%H" -- "*/.env" "**/.env" ".env"
```

This command should return empty results.

## Questions or Issues?

If you encounter any problems during the cleanup process, please:
1. Stop immediately
2. Do not force push
3. Contact the DevOps team
4. Restore from backup if needed

## References

- [git-filter-repo Documentation](https://github.com/newren/git-filter-repo)
- [BFG Repo Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [OWASP: Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
