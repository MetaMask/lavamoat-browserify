# syntax=docker/dockerfile:1.12

# development and testing image
# contains the entire built source-repository under /app

ARG NODE_VERSION=18
ARG BASE_IMAGE_DIGEST=sha256:ce927bbeecbcdb91a41d3bb64014bf44796eb06a35a4798fe0ebbfe3725024c6 # docker.io/library/node:18-alpine
FROM docker.io/library/node:${NODE_VERSION}-alpine@${BASE_IMAGE_DIGEST}

WORKDIR /app

RUN apk add --no-cache \
    bash git jq \
    # for node-gyp builds \
    python3 build-base make \
  && chown node:node /app

COPY --chown=node:node . .
USER node

ARG GIT_USER_NAME="Your Name"
ARG GIT_USER_EMAIL="you@example.com"
RUN git config --global user.email "${GIT_USER_EMAIL}" && \
  git config --global user.name "${GIT_USER_NAME}" && \
  npm ci && \
  npm run setup && \
  npm run build

ENTRYPOINT ["/usr/local/bin/npm"]
