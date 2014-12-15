# Pull base image.
FROM ubuntu:14.04

# Install Java.
RUN \
  apt-get update && \
  apt-get -y upgrade && \
  apt-get install -y software-properties-common && \
  echo oracle-java8-installer shared/accepted-oracle-license-v1-1 select true | debconf-set-selections && \
  add-apt-repository -y ppa:webupd8team/java && \
  apt-get update && \
  apt-get install -y oracle-java8-installer ant git && \
  rm -rf /var/lib/apt/lists/* && \
  rm -rf /var/cache/oracle-jdk8-installer && \
  wget http://nodejs.org/dist/v0.10.33/node-v0.10.33-linux-x64.tar.gz && \
  tar xvzf node-v0.10.33-linux-x64.tar.gz && \
  cp -r node-v0.10.33-linux-x64/* /usr/local && \
  rm -f node-v0.10.33-linux-x64.tar.gz

ADD . /usr/src/nez/
WORKDIR /usr/src/nez

RUN npm install
CMD ["npm", "start"]
