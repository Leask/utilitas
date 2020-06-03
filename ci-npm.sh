#!/bin/sh

npm version patch \
&& git commit -am 'npm version patch' \
&& npm publish \
&& git pull \
&& git push
