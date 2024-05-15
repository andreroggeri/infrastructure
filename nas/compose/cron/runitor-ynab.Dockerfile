FROM runitor/runitor:v1.2.0-build.2-ubuntu
ENV DEBIAN_FRONTEND noninteractive
RUN apt-get update && apt-get install -y python3 python3-pip git locales curl pipx

RUN apt-get clean && rm -rf /var/lib/apt/lists/*

RUN pip3 install git+https://github.com/andreroggeri/br-to-ynab.git@96771de6d481850f5bbeb4b54ba991846fec55b4

RUN playwright install

RUN locale-gen pt_BR.UTF-8

RUN update-locale LANG=pt_BR.UTF-8

WORKDIR /scripts

COPY . . 
