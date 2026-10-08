FROM php:8.2-cli

# Install PostgreSQL development headers and PHP PDO extension
RUN apt-get update && apt-get install -y libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql

COPY . /app
WORKDIR /app

# Run PHP built-in webserver on dynamic PORT (Render compatible)
CMD [ "sh", "-c", "php -S 0.0.0.0:${PORT:-8080} index.php" ]
