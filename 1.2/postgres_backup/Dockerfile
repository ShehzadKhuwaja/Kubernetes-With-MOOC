FROM postgres:13-alpine

# Install dependencies
RUN apk add --no-cache \
    bash \
    curl \
    python3 \
    libc6-compat

# Install Google Cloud SDK (includes gsutil)
RUN curl -sSL https://sdk.cloud.google.com | bash

ENV PATH="/root/google-cloud-sdk/bin:${PATH}"

WORKDIR /app

COPY backup.sh /app/backup.sh
RUN chmod +x /app/backup.sh

ENTRYPOINT ["/app/backup.sh"]
