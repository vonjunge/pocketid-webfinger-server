FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies (using install instead of ci since we don't have a lockfile)
RUN npm install --omit=dev

# Bundle app source
COPY . .

# Set environment to production
ENV NODE_ENV=production

# Run as non-root user for better security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Expose port (Note: This is only for documentation, ports are not published in production)
EXPOSE 3000

# Start the service
CMD ["npm", "start"]
