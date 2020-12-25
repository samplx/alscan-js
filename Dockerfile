
FROM node:lts-buster

# Create the app directory
WORKDIR /usr/src/app

# Copy the sources
COPY . .

RUN npm install \
    && npm test \
    && npm link

ENTRYPOINT ["/usr/local/bin/alscan"]
