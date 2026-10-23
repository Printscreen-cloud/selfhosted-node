FROM node:24.22.1-alpine@sha256:06d7adf3e0ef61a13f1d28682726366f97a15aa1888c934d3ecec86c33918b53 AS dependencies

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM gcr.io/distroless/nodejs24-debian13:nonroot@sha256:78f07ef1b5ea71ad7c055df15d0dd8997f2d288f9158623c4d4ae3d765b7d50d

WORKDIR /usr/src/app

ENV NODE_ENV=production \
    PUBLIC_FOLDER=public \
    PORT=3000

COPY --from=dependencies --chown=65532:65532 /usr/src/app/node_modules ./node_modules
COPY --chown=65532:65532 package.json index.js version.txt ./
COPY --chown=65532:65532 classes ./classes

EXPOSE 3000

USER 65532:65532

CMD ["index.js"]
