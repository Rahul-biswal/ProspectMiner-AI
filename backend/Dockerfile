FROM ghcr.io/puppeteer/puppeteer:22

ENV NODE_ENV=production
# Tell Puppeteer to skip downloading Chromium since the base image already ships it
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# The Puppeteer image uses a non-root user 'pptruser'
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY --chown=pptruser:pptruser package*.json ./
RUN npm install

# Copy all other backend source files
COPY --chown=pptruser:pptruser . .

EXPOSE 3001

CMD ["npm", "start"]
