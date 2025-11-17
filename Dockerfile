# 使用官方 PHP-Apache 镜像
FROM php:8.2-apache

# 将项目文件复制到 Apache web 目录
COPY . /var/www/html/

# 设置工作目录
WORKDIR /var/www/html/

# 启用常用 PHP 扩展（如果你用到 MySQL）
RUN docker-php-ext-install pdo pdo_mysql

# 让 Apache 对外监听正确的端口
EXPOSE 10000

# 将 Apache 默认端口修改为 10000（Render 要求）
RUN sed -i 's/80/10000/' /etc/apache2/ports.conf && \
    sed -i 's/80/10000/' /etc/apache2/sites-enabled/000-default.conf

# 执行 Apache
CMD ["apache2-foreground"]
