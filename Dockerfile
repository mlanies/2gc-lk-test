FROM node:18-alpine AS client-builder

WORKDIR /app/client

COPY client/package.json ./
RUN npm install

COPY client/ .
RUN npm run build

FROM node:18-alpine

RUN apk add --no-cache \
    cairo-dev jpeg-dev libpng-dev ossp-uuid-dev ffmpeg-dev \
    pango-dev libvncserver-dev libwebp-dev openssl-dev freerdp-dev freerdp \
    autoconf automake libtool libpulse libogg libc-dev \
    python3 py3-pip py3-setuptools make gcc g++ \
    && python3 -m venv /opt/venv \
    && . /opt/venv/bin/activate \
    && pip install --upgrade pip setuptools \
    && deactivate \
    && apk add --no-cache --virtual .build-deps build-base git

# Используем ту же структуру, что и для Apache Guacamole Server
RUN git clone --depth=1 https://github.com/mlanies/2gc-lk-test.git \
    && cd 2gc-lk-test \
    && git fetch --all --tags \
    && git checkout main \
    && autoreconf -fi || true \
    && ./configure --with-init-dir=/etc/init.d --enable-rdp || true \
    && make \
    && make install \
    && cd .. \
    && rm -rf 2gc-lk-test

RUN apk del .build-deps \
    && rm -rf /var/cache/apk/*

ENV NODE_ENV=production

WORKDIR /app

COPY --from=client-builder /app/client/dist ./dist

COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY server/ server/
COPY docker-start.sh .

RUN chmod +x docker-start.sh

EXPOSE 6989

CMD ["/bin/sh", "docker-start.sh"]
