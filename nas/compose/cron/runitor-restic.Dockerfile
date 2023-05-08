FROM runitor/runitor:v1.2.0-ubuntu as builder

ENV RESTIC_VERSION=0.15.1

RUN apt-get update && apt-get install -y curl bzip2

RUN curl -L -o restic.bz2 https://github.com/restic/restic/releases/download/v${RESTIC_VERSION}/restic_${RESTIC_VERSION}_linux_amd64.bz2

RUN bzip2 -d restic.bz2 && chmod +x restic

FROM runitor/runitor:v1.2.0-ubuntu

COPY --from=builder /restic /usr/local/bin/restic

WORKDIR /scripts

ADD ./backup-volumes.sh backup-volumes.sh
ADD ./backup-prune.sh backup-prune.sh