FROM ubuntu:trusty

RUN apt-get update && apt-get upgrade -y && apt-get install -y nginx curl
RUN apt-get install -y git
RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.25.4/install.sh | bash
RUN . /root/.nvm/nvm.sh && nvm install 0.12
RUN . /root/.nvm/nvm.sh && nvm use 0.12 && npm install gulpjs/gulp-cli#4.0 -g
RUN . /root/.nvm/nvm.sh && nvm use 0.12 && npm install bower -g

RUN rm /etc/nginx/sites-enabled/default
COPY ./website.conf /etc/nginx/sites-enabled/default

COPY . /tmp/build
RUN . /root/.nvm/nvm.sh && nvm use 0.12 && cd /tmp/build && npm install && gulp production
RUN rm -f /var/www && mv /tmp/build/dist /var/www

CMD 'nginx'
