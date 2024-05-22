FROM runitor/runitor:v1.2.0-build.2-ubuntu
ENV DEBIAN_FRONTEND noninteractive
RUN apt-get update && apt-get install -y python3 python3-pip git locales curl pipx

RUN apt-get clean && rm -rf /var/lib/apt/lists/*

RUN pip3 install git+https://github.com/andreroggeri/br-to-ynab.git@bd72841f7fea8a4331ff1886860e420d4bbe41bb

RUN playwright install

RUN playwright install-deps

RUN locale-gen pt_BR.UTF-8

RUN update-locale LANG=pt_BR.UTF-8

WORKDIR /scripts

COPY . . 
