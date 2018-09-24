
FROM node:8

# Create the app directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./

RUN npm install \
    && npm install -g gulp

# Copy the sources
COPY . .

CMD [ "npx", "gulp", "test" ]

