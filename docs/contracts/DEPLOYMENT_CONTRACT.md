# Deployment Contract

> Source of truth for all deployment procedures in the P&L Manager project.
> Every deploy MUST follow this contract. No exceptions.

---

## Table of Contents

1. [Project Configuration](#project-configuration)
2. [Pre-Deploy Checklist](#pre-deploy-checklist)
3. [Deploy Order](#deploy-order)
4. [Environment Variables](#environment-variables)
5. [Secrets Management](#secrets-management)
6. [Hosting Architecture](#hosting-architecture)
7. [Rollback Procedure](#rollback-procedure)
8. [CI/CD Pipeline](#cicd-pipeline)
9. [Deploy Verification](#deploy-verification)
10. [Troubleshooting](#troubleshooting)

---

## Project Configuration

| Setting          | Value                |
| ---------------- | -------------------- |
| Firebase Project | `pylhospitality`     |
| Region           | `europe-west1`       |
| Framework        | React 19 + Vite 7.2  |
| Node.js          | 20 LTS (Functions)   |
| Deploy Method    | Firebase CLI (manual) |

```bash
# Verify you are targeting the correct project
firebase use pylhospitality
firebase projects:list
```

---

## Pre-Deploy Checklist

Every deploy MUST pass ALL of these checks. A single failure blocks the deploy.

### Mandatory Checks

- [ ] **TypeScript compilation**: `npx tsc --noEmit` exits with 0 errors
- [ ] **Production build**: `npm run build` completes successfully
- [ ] **Tests pass**: `npm test` (all suites green, 0 failures)
- [ ] **Visual verification**: open `dist/` locally and verify critical pages render
- [ ] **No console.log**: no `console.log` statements in production code
- [ ] **No hardcoded secrets**: no API keys, tokens, or passwords in source code
- [ ] **Environment variables**: `.env` contains all required `VITE_FIREBASE_*` vars

### Check Commands

```bash
# Run all checks in sequence
npx tsc --noEmit && npm run build && npm test

# Verify no console.log in src/
grep -rn "console.log" src/ --include="*.ts" --include="*.tsx" | grep -v "// DEBUG"

# Verify no secrets in source
grep -rn "VITE_FIREBASE_API_KEY\s*=" src/ --include="*.ts" --include="*.tsx"
```

### Pre-Deploy Decision Tree

```
tsc --noEmit fails?
  YES -> Fix TypeScript errors. DO NOT deploy.
  NO  -> Continue

npm run build fails?
  YES -> Fix build errors. DO NOT deploy.
  NO  -> Continue

npm test has failures?
  YES -> Fix failing tests. DO NOT deploy.
  NO  -> Continue

Visual verification shows broken UI?
  YES -> Investigate and fix. DO NOT deploy.
  NO  -> PROCEED with deploy.
```

---

## Deploy Order

Firebase resources MUST be deployed in this specific order to avoid broken references.

### Order of Operations

| Step | Resource           | Command                              | Why This Order                                  |
| ---- | ------------------ | ------------------------------------ | ----------------------------------------------- |
| 1    | Firestore Rules    | `firebase deploy --only firestore:rules`   | Rules must be active before new data writes     |
| 2    | Firestore Indexes  | `firebase deploy --only firestore:indexes` | Indexes must exist before queries use them      |
| 3    | Cloud Functions    | `firebase deploy --only functions`         | Functions depend on rules and indexes           |
| 4    | Hosting            | `firebase deploy --only hosting`           | Frontend depends on all backend being ready     |

### Full Deploy Command

```bash
# Deploy everything in order (single command)
firebase deploy --only firestore:rules,firestore:indexes,functions,hosting

# Or step by step (preferred for debugging)
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only functions
firebase deploy --only hosting
```

### Partial Deploys

When changes are limited to a single layer:

```bash
# Frontend-only changes (UI, components, styles)
firebase deploy --only hosting

# Security rules changes
firebase deploy --only firestore:rules

# Cloud Functions changes
firebase deploy --only functions
```

**Rule**: If unsure which resources changed, deploy ALL in order.

---

## Environment Variables

### Client-Side Variables (.env)

All client-side environment variables use the `VITE_` prefix (required by Vite).

```env
# .env (DO NOT commit this file)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=pylhospitality.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=pylhospitality
VITE_FIREBASE_STORAGE_BUCKET=pylhospitality.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### Template File (.env.example)

```env
# .env.example (committed to repo as template)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

### Rules

| Rule                                          | Enforced By      |
| --------------------------------------------- | ---------------- |
| `.env` is in `.gitignore`                     | Git              |
| `.env.example` is committed                   | Code review      |
| All vars start with `VITE_`                   | Vite (build-time)|
| No secrets in `VITE_*` vars                   | This contract    |
| Firebase config is public (by design)         | Firebase docs    |

---

## Secrets Management

### Client-Side: NEVER Store Secrets

```typescript
// FORBIDDEN - secrets in client code
const CLAUDE_API_KEY = "sk-ant-..."; // NEVER
const STRIPE_SECRET = import.meta.env.VITE_STRIPE_SECRET; // NEVER

// CORRECT - only public Firebase config in client
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY, // OK - this is a public identifier
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};
```

### Server-Side: Cloud Functions Secrets

```typescript
// Cloud Functions: use defineSecret()
import { defineSecret } from "firebase-functions/params";

const anthropicApiKey = defineSecret("ANTHROPIC_API_KEY");

export const processDocument = onCall(
  { secrets: [anthropicApiKey] },
  async (request) => {
    const apiKey = anthropicApiKey.value(); // Available at runtime only
  }
);
```

### Setting Secrets

```bash
# Set a secret in Firebase
firebase functions:secrets:set ANTHROPIC_API_KEY

# List existing secrets
firebase functions:secrets:list

# Access a secret value (for verification)
firebase functions:secrets:access ANTHROPIC_API_KEY
```

### Secret Inventory

| Secret              | Used By              | Purpose                          |
| ------------------- | -------------------- | -------------------------------- |
| ANTHROPIC_API_KEY   | processDocument CF   | Claude Vision document parsing   |
| (future) RESEND_KEY | sendNotification CF  | Transactional email              |

---

## Hosting Architecture

### Current Setup

| Site     | URL                                     | Content         |
| -------- | --------------------------------------- | --------------- |
| Main App | `pylhospitality.web.app`                | P&L Manager SPA |

### Future Setup (2 sites)

| Site      | URL                                        | Content          |
| --------- | ------------------------------------------ | ---------------- |
| App       | `pylhospitality.web.app`                   | Main application |
| Admin     | `pylhospitality-admin.web.app`             | Admin dashboard  |

### Hosting Configuration

```json
// firebase.json - hosting section
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
        ]
      },
      {
        "source": "index.html",
        "headers": [
          { "key": "Cache-Control", "value": "no-cache" }
        ]
      }
    ]
  }
}
```

---

## Rollback Procedure

### When to Rollback

- Production error visible to users
- Critical functionality broken (login, data entry, P&L reports)
- Performance degradation (page load > 5s)
- Security vulnerability discovered

### Rollback Steps

```bash
# 1. Identify the last known good commit
git log --oneline -10

# 2. Revert to the previous commit
git revert HEAD --no-edit

# 3. Run pre-deploy checks
npx tsc --noEmit && npm run build && npm test

# 4. Deploy the reverted version
firebase deploy --only hosting

# 5. Verify rollback worked
# Open the production URL and test critical flows
```

### Emergency Rollback (Firebase Console)

If CLI is unavailable:

1. Go to Firebase Console > Hosting
2. Click on the previous deploy in the release history
3. Click "Rollback to this version"

### Post-Rollback

- [ ] Notify the team about the rollback
- [ ] Create an issue documenting what went wrong
- [ ] Fix the root cause on a separate branch
- [ ] Re-deploy only after all checks pass

---

## CI/CD Pipeline

### Current: Manual Deploy

```bash
# Developer runs manually
npx tsc --noEmit
npm run build
npm test
firebase deploy
```

### Future: GitHub Actions

```yaml
# .github/workflows/deploy.yml (planned)
name: Deploy to Firebase
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npm run build
      - run: npm test
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
          projectId: pylhospitality
```

### CI/CD Principles

- Main branch is ALWAYS deployable
- Every push to main triggers deploy (future)
- Preview channels for PRs (future)
- No manual deploys once CI/CD is active

---

## Deploy Verification

After every deploy, verify these critical flows:

### Verification Checklist

- [ ] Login page loads and accepts credentials
- [ ] Dashboard renders with real data
- [ ] Almacen (inventory) page loads all tabs
- [ ] Document upload (OCR) accepts a photo
- [ ] P&L report generates correctly
- [ ] Navigation between all routes works
- [ ] No errors in browser console
- [ ] Mobile layout renders correctly

### Automated Smoke Test (Future)

```bash
# Playwright smoke test against production
npx playwright test --project=smoke --base-url=https://pylhospitality.web.app
```

---

## Troubleshooting

### Common Deploy Issues

| Issue                              | Cause                        | Fix                                          |
| ---------------------------------- | ---------------------------- | -------------------------------------------- |
| `Error: Not in a Firebase project` | Wrong directory               | `cd` to project root, verify `firebase.json` |
| `Permission denied`               | Wrong Firebase account        | `firebase login` with correct account        |
| `Build failed`                     | TypeScript or dependency error| Fix errors, re-run `npm run build`           |
| `Functions deploy timeout`         | Large function bundle         | Check function dependencies, optimize        |
| `Hosting 404 on routes`           | Missing SPA rewrite           | Add rewrite rule in `firebase.json`          |
| `Index not ready`                 | Firestore index building      | Wait 2-5 minutes, check console              |

### Verify Current Project

```bash
firebase use
# Should output: pylhospitality

firebase projects:list
# Verify pylhospitality is in the list
```

---

## Version History

| Date       | Change                          | Author |
| ---------- | ------------------------------- | ------ |
| 2026-03-27 | Initial contract                | Aitor  |
