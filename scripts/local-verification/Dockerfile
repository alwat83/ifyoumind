# Browser/OS pin matches package-lock.json Playwright 1.56.0 and Ubuntu 24.04 visuals.
FROM mcr.microsoft.com/playwright:v1.56.0-noble@sha256:35246d87a7c88ea9b771c65d33171b2611b02a8253b4b12ce6f94376c55f99f2
USER root
RUN apt-get update && apt-get install -y --no-install-recommends openjdk-21-jre-headless \
    && rm -rf /var/lib/apt/lists/*
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
# Runtime uses the caller's unprivileged uid, fresh HOME and only the source/report mount.
# This versioned upstream image includes Node 22; the report records that hosted Node 20 difference.
