#!/bin/sh
set -e
git config --local core.hooksPath .githooks
echo "Git hooks enabled for this repository (core.hooksPath=.githooks)."
