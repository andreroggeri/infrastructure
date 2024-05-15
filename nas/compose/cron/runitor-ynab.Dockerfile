FROM runitor/runitor:v1.2.0-build.2-ubuntu
ENV DEBIAN_FRONTEND noninteractive
RUN apt-get update && apt-get install -y python3 python3-pip git locales curl pipx

RUN apt-get clean && rm -rf /var/lib/apt/lists/*

RUN pip3 install git+https://github.com/andreroggeri/br-to-ynab.git@1de263e32c5f0e24df47ae5c736a714423543ece

RUN locale-gen pt_BR.UTF-8

RUN update-locale LANG=pt_BR.UTF-8

WORKDIR /scripts

COPY . . 
