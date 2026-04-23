#!/bin/bash
# Fix git submodule issue and push all changes
set -e
cd /Users/nikollasanches/Documents/Petlife

echo "=== Removing old .git backup ==="
rm -rf .git.bak

echo "=== Removing backend nested .git ==="
rm -rf petlife-backend/.git

echo "=== Reinitializing git ==="
rm -rf .git
git init
git config user.name "sanchesnikollas"
git config user.email "nikollas@sanchescreative.com"
git remote add origin https://github.com/sanchesnikollas/petlife.git

echo "=== Adding all files ==="
git add -A

echo "=== Files staged ==="
echo "Total: $(git ls-files | wc -l | tr -d ' ') files"
echo "Backend: $(git ls-files -- petlife-backend/ | wc -l | tr -d ' ') files"

echo "=== Committing ==="
git commit -m "feat: PetLife v1.0.0 — complete app with backend as regular directory

- Fix Welcome 'Pular' button (pointer-events-none on decorative circles)
- Fix petlife-backend from gitlink to regular directory (74 files)
- All 10 phases implemented: food DB, calculator, PDF, community, push, analytics, legal, PWA, Capacitor

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"

echo "=== Pushing ==="
git push origin main --force

echo ""
echo "✅ Done! All files pushed including petlife-backend/"
echo "Railway will auto-redeploy from GitHub."
