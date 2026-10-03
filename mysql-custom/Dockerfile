FROM mysql:8.0

ENV MYSQL_ROOT_PASSWORD=password
ENV MYSQL_DATABASE=gha_asset_manager

# Railway passes PORT environment variable dynamically
RUN echo '[mysqld]\nport=3306\n' > /etc/mysql/conf.d/port.cnf
RUN echo '#!/bin/bash\nsed -i "s/3306/$PORT/g" /etc/mysql/conf.d/port.cnf\n/entrypoint.sh mysqld' > /start.sh && chmod +x /start.sh
ENTRYPOINT ["/start.sh"]
