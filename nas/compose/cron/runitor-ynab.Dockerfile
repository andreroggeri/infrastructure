FROM runitor/runitor:v1.2.0-ubuntu

RUN apt-get update && apt-get install -y python3 python3-pip git

RUN apt-get clean && rm -rf /var/lib/apt/lists/*

RUN pip3 install --upgrade pip

RUN pip3 install git+https://github.com/andreroggeri/br-to-ynab.git@f699523cd25a105be777e8e21c1cb457923d19b8

WORKDIR /scripts

COPY . . 