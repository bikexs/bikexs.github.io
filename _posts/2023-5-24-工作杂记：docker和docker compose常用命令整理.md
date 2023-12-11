---
title: docker和docker compose常用命令整理
author: bikexs
date: 2023-3-1 7:00:00 +0800
categories: [java, other]
tags: [工作杂记]
math: true
mermaid: true
---

### 1. Docker常用命令

- 拉取镜像：

```
拉取镜像：
```

- 查看本地镜像：

```
docker images
```

- 删除本地镜像：

```
docker rmi image_name:tag
```

- 运行容器：

```
docker run [options] image_name:tag
```

- 查看正在运行的容器：

```
docker ps
```

- 停止容器：

```
docker stop container_id
```

- 启动已停止的容器：

```
docker start container_id
```

- 删除容器：

```
docker rm container_id
```

- 进入容器内部：

```
docker exec -it container_id /bin/bash
```

- 创建数据卷：

```
docker volume create volume_name
```

- 查看数据卷：

```
docker volume ls
```

- 创建自定义网络：

```
docker network create network_name
```

- 查看网络：

```
docker network ls
```

### 2. Docker Compose常用命令

ps: 旧版本的docker compose用的命令是docker-compose，新版的直接docker compose。

- 编排和运行多容器应用

```
docker-compose up
```

- 启动容器组（后台运行）：

```
docker-compose up -d
```

- 停止容器组：

```
docker-compose down
```

- 查看服务状态：

```
docker-compose ps
```

- 查看服务日志：

```
docker-compose logs
```

- 构建或重建服务：

```
docker-compose build
```

- 指定某个服务构建:

```
docker-compose build service_name
```

- 查看 Docker Compose 版本：

```
docker-compose version
```

### 3. Dockerfile编写常用命令

```
# 使用 OpenJDK 17 作为基础镜像
FROM openjdk:17

# 维护者信息
LABEL maintainer="your_name@example.com"

# 设置工作目录
WORKDIR /app

# 复制应用程序的 JAR 文件到容器中
COPY target/*.jar /app/

# 安装依赖（根据需要安装相关依赖）
RUN apt-get update && \
    apt-get install -y python3

# 暴露应用程序运行的端口
EXPOSE 8080

# 设置容器启动时的命令
CMD ["java", "-jar", "打包的jar名.jar"]

```

### 4.docker compose编写常用命令

```
version: '3'

services:
  web:
    image: nginx:latest
    ports:
      - "8080:80"
  db:
    image: mysql:latest
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: my_database
      MYSQL_USER: user
      MYSQL_PASSWORD: password
  redis:
    image: redis
    container_name: bikexs-redis-container
    ports:
      - "6379:6379"
  ...其他也可以是自己的私有镜像仓库的镜像
```