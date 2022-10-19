FROM node:18-slim
WORKDIR /root
ENV LANG C.UTF-8
ENV LC_ALL C.UTF-8

COPY index.html .
COPY index.js .
COPY package-lock.json .
COPY package.json .
COPY socket.io.min.js .

RUN npm install

ENTRYPOINT ["node", "index.js"]

