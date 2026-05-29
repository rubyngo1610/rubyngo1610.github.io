#!/bin/bash
# push-resume.sh
#
# Triggered automatically by the macOS LaunchAgent when
# HongNgoc_Ngo-Resume-Latest.pdf changes in Google Drive.
#
# Copies the PDF into the repo, commits, and pushes — which triggers
# the GitHub Actions deploy workflow.
#
# Logs to: /tmp/push-resume.log

LOG=/tmp/push-resume.log
REPO="/Users/rubyngo/Library/CloudStorage/GoogleDrive-hn2589@nyu.edu/My Drive/my-portfolio"
RESUME_SRC="/Users/rubyngo/Library/CloudStorage/GoogleDrive-ngocrubytin@gmail.com/My Drive/CV application/HongNgoc_Ngo-Resume-Latest.pdf"
RESUME_DEST="$REPO/mvp-keys/public/resume.pdf"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] resume-sync triggered" >> "$LOG"

# Wait a moment for Google Drive to finish writing the file
sleep 3

# Source file must exist and be a real PDF (> 10 KB)
if [ ! -f "$RESUME_SRC" ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✗ source not found, skipping" >> "$LOG"
  exit 0
fi

src_size=$(stat -f%z "$RESUME_SRC")
if [ "$src_size" -lt 10240 ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✗ source too small ($src_size bytes), skipping" >> "$LOG"
  exit 0
fi

# Skip if unchanged
dest_size=$(stat -f%z "$RESUME_DEST" 2>/dev/null || echo 0)
if [ "$src_size" = "$dest_size" ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✓ already up to date ($src_size bytes)" >> "$LOG"
  exit 0
fi

# Copy
cp "$RESUME_SRC" "$RESUME_DEST"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] copied ($dest_size → $src_size bytes)" >> "$LOG"

# Commit and push
cd "$REPO" || exit 1
git add mvp-keys/public/resume.pdf

# Nothing staged means the copy didn't actually differ (shouldn't happen, but safe)
if git diff --cached --quiet; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✓ git: nothing to commit" >> "$LOG"
  exit 0
fi

git commit -m "chore: update resume PDF"
git push
echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✓ pushed — deploy triggered" >> "$LOG"
