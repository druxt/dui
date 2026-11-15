#!/usr/bin/env bash
#
# Lint a merge request or pull request title with commitlint.
#
# These repositories squash-merge, so the title becomes the merge commit's
# subject. A title that is not a Conventional Commit therefore becomes a
# commit message that lint:commit rejects, and every later push to the target
# branch fails on a commit nobody can edit any more.
#
# The title is linted as the subject it becomes rather than on its own.
# GitHub's squash subject is the title followed by " (#<number>)", which can
# push a title that fits inside commitlint's header length limit past it once
# merged, so the number is appended when the host provides one. GitLab's
# default squash message is the title unchanged, and sets no number here.
#
# Environment:
#   MERGE_REQUEST_TITLE   the title to check, then CI_MERGE_REQUEST_TITLE.
#                         A title is short enough that GitLab never cuts its
#                         variable, so there is no API fallback to add here.
#   MERGE_REQUEST_NUMBER  optional, appended as " (#N)" when set
#
# Exit: 0 clean, 1 commitlint rejected the subject, 2 nothing to check.

set -euo pipefail

title="${MERGE_REQUEST_TITLE:-${CI_MERGE_REQUEST_TITLE:-}}"
number="${MERGE_REQUEST_NUMBER:-}"

if [ -z "$title" ]; then
  echo "[FAIL] no title to check: neither MERGE_REQUEST_TITLE nor CI_MERGE_REQUEST_TITLE is set." >&2
  echo "       GitLab exposes it as CI_MERGE_REQUEST_TITLE in a merge request pipeline;" >&2
  echo "       other platforms pass MERGE_REQUEST_TITLE." >&2
  exit 2
fi

# GitLab keeps a draft marker in the title itself and strips it when the
# merge request is marked ready, so it is not part of the eventual subject.
# GitHub holds draft state in a flag and never prefixes the title.
stripped="$(printf '%s' "$title" | sed -E 's/^[[:space:]]*(\[?(Draft|WIP)\]?)[[:space:]]*:?[[:space:]]*//I')"

if [ -z "$stripped" ]; then
  echo "[FAIL] the title is a draft marker and nothing else: \"$title\"." >&2
  exit 1
fi

subject="$stripped"
if [ -n "$number" ]; then
  subject="$stripped (#$number)"
fi

echo "Checking the subject this change will be merged as:"
echo "  $subject"

if printf '%s\n' "$subject" | npx --no-install commitlint --verbose; then
  echo "[PASS] the title merges as a valid Conventional Commit subject."
else
  status=$?
  echo "[FAIL] the title does not merge as a valid Conventional Commit subject." >&2
  echo "       Squash-merge makes it the commit message, so lint:commit would" >&2
  echo "       then fail on every later push to the target branch." >&2
  exit "$status"
fi
