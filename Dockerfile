
FROM node:lts-trixie

# Create the app directory
WORKDIR /opt/alscan/src

# Copy the sources
COPY . .

RUN npm install \
    && npm test \
    && npm link \
    && mkdir -p /opt/alscan/bin \
    && cd /opt/alscan/bin \
    && npm link alscan-js \
    && ln -s node_modules/alscan-js/bin/alscan-cli.ts alscan

USER node

WORKDIR /work

ENTRYPOINT ["/opt/alscan/bin/alscan"]

VOLUME [ "/work" ]
