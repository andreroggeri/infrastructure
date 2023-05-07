FROM runitor/runitor:v1.2.0-ubuntu

RUN apt-get update && apt-get install -y python3 python3-pip git

RUN apt-get clean && rm -rf /var/lib/apt/lists/*

RUN pip3 install --upgrade pip

RUN pip3 install git+https://github.com/andreroggeri/br-to-ynab.git@e6a6aba5047227fffc71151bcd8123aa516535b5

RUN pip3 install git+https://github.com/andreroggeri/pybradesco.git

RUN pip3 install git+https://github.com/andreroggeri/python-alelo.git

WORKDIR /scripts

COPY . . 