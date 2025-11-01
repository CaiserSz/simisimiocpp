#!/bin/bash

SSL_DIR="../nginx/ssl"
mkdir -p $SSL_DIR

# Kendi imzalı SSL sertifikası oluştur
echo "Generating self-signed SSL certificate..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout $SSL_DIR/key.pem \
  -out $SSL_DIR/cert.pem \
  -subj "/C=TR/ST=Istanbul/L=Istanbul/O=AC Charging/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

# İzinleri düzenle
chmod 600 $SSL_DIR/*.pem

echo "SSL certificates generated in $SSL_DIR/"
