# Use an official Node.js runtime as a parent image
FROM node:18

# Set working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json into the container
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the app's source code into the container
COPY . .

# Expose the port the app will run on
EXPOSE 3000

# Specify default environment variables (can be overridden by Docker Compose or Docker command)
ENV NODE_ENV=production
ENV AUTH=printscreen_auth
ENV SECRET=printscreen_secret
ENV PUBLIC_FOLDER=public
ENV PORT=3000

# Command to run the app
CMD [ "node", "index.js" ]
