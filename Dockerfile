FROM node:16.15-alpine as BUILD_IMAGE

ENV NODE_OPTIONS=--max_old_space_size=4096
ENV SERVER="docker"
# Create app directory
WORKDIR /usr/src/app
COPY package*.json ./

# Install dependencies for production only
RUN npm install --production

# Bundle app source
COPY . .

# Remove unused dependencies to optimize space
RUN npm prune --production

EXPOSE 3000
CMD [ "npm", "start" ]
