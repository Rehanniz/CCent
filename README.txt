curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer



dnf install -y nginx

firewall-cmd --add-service=http --permanent
firewall-cmd --add-service=https --permanent 
firewall-cmd --reload


dnf install -y redis

systemctl start redis
systemctl enable redis


setsebool -P httpd_can_network_connect 1
setsebool -P httpd_execmem 1
setsebool -P httpd_unified 1


mysql_secure_installation


[pterodactyl]

user = nginx
group = nginx

listen = /var/run/php-fpm/pterodactyl.sock
listen.owner = nginx
listen.group = nginx
listen.mode = 0750

pm = ondemand
pm.max_children = 9
pm.process_idle_timeout = 10s
pm.max_requests = 200

systemctl enable php-fpm
systemctl start php-fpm


mkdir -p /var/www/pterodactyl
cd /var/www/pterodactyl


curl -Lo panel.tar.gz https://github.com/pterodactyl/panel/releases/latest/download/panel.tar.gz
tar -xzvf panel.tar.gz
chmod -R 755 storage/* bootstrap/cache/


mysql -u root -p

CREATE USER 'pterodactyl'@'127.0.0.1' IDENTIFIED BY 'lol123';
CREATE DATABASE panel;
GRANT ALL PRIVILEGES ON panel.* TO 'pterodactyl'@'127.0.0.1' WITH GRANT OPTION;
exit

cp .env.example .env
composer install --no-dev --optimize-autoloader

# Only run the command below if you are installing this Panel for
# the first time and do not have any Pterodactyl Panel data in the database.
php artisan key:generate --force

php artisan p:environment:setup
php artisan p:environment:database

# To use PHP's internal mail sending (not recommended), select "mail". To use a
# custom SMTP server, select "smtp".
php artisan p:environment:mail

php artisan migrate --seed --force

php artisan p:user:make

# If using NGINX or Apache (not on CentOS):
chown -R www-data:www-data /var/www/pterodactyl/*

# If using NGINX on CentOS:
chown -R nginx:nginx /var/www/pterodactyl/*

# If using Apache on CentOS
chown -R apache:apache /var/www/pterodactyl/*

sudo crontab -e

* * * * * php /var/www/pterodactyl/artisan schedule:run >> /dev/null 2>&1


# Pterodactyl Queue Worker File
# ----------------------------------

[Unit]
Description=Pterodactyl Queue Worker
After=redis-server.service

[Service]
# On some systems the user and group might be different.
# Some systems use `apache` or `nginx` as the user and group.
User=www-data
Group=www-data
Restart=always
ExecStart=/usr/bin/php /var/www/pterodactyl/artisan queue:work --queue=high,standard,low --sleep=3 --tries=3
StartLimitInterval=180
StartLimitBurst=30
RestartSec=5s

[Install]
WantedBy=multi-user.target


sudo systemctl enable --now redis-server


sudo systemctl enable --now pteroq.service
