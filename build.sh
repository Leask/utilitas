#!/bin/sh

npm version patch \
&& npm upgrade uuid \
&& ( git commit -am 'npm upgrade uuid' || true ) \
&& git pull \
&& git push \
&& npm publish
