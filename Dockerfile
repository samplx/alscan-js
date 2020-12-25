
FROM node:lts-buster

# Create the app directory
WORKDIR /usr/src/app

# Copy the sources
COPY . .

RUN npm install

CMD [ "npm", "test" ]

