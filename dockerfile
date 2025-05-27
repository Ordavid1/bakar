# Use an official Node.js runtime as a parent image
FROM node:18-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or npm-shrinkwrap.json)
COPY package*.json ./

# Install app dependencies
RUN npm install --omit=dev
# If you are building your code for production
# RUN npm ci --omit=dev --ignore-scripts

# Bundle app source
COPY . .

# Your app binds to port 3000, so GCR will automatically use this
# If you were using a different port, you would expose it here
# EXPOSE 3000

# Define the command to run your app
CMD [ "npm", "start" ]