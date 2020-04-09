FROM node:10

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production
RUN npm install pm2 -g
ENV PM2_PUBLIC_KEY rpi4g48sm056m0i
ENV PM2_SECRET_KEY ckyi0d5qif4kpuw

# Bundle app source
COPY . .

EXPOSE 3000
CMD ["pm2-runtime", "app.js", "--name", "Palmeus JS"]