FROM runitor/runitor:v1.2.0-ubuntu

RUN apt-get update && apt-get install -y python3 python3-pip git

RUN apt-get clean && rm -rf /var/lib/apt/lists/*

RUN pip3 install --upgrade pip

RUN pip3 install git+https://github.com/andreroggeri/br-to-ynab.git@57df4d793d352e2d2fa1849a81ed7729fae56c5b

WORKDIR /scripts

COPY . . 