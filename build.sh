#!/usr/bin/env bash

set -ex

docker build -t sqybi/v2ray-port-change:latest .
docker push sqybi/v2ray-port-change:latest
