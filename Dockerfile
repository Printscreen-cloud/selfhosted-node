FROM node:24-alpine AS dependencies

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM gcr.io/distroless/nodejs24-debian13:nonroot@sha256:af85d11ce7ef10172855a6e3649e3e8125b1b9e3ca41849ec2918036f05cb212

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
