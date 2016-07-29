#!/bin/bash

## Compile the less files to css
./compile.sh

## Get the bucket name from the arguments
BUCKET=""
for i in "$@"
do
  case $i in
    -b=*|--bucket=*)
    BUCKET="${i#*=}"
    shift
    ;;
  esac
done

echo $BUCKET
if [ "$BUCKET" = "" ]; then
  echo "No bucket name specified. Usage: $ ./deploy.sh --bucket=the-bucket-name"
  exit
else
  echo "Using bucket: ${BUCKET}"
fi

## Deploy to S3
aws s3 cp _tmp/styles.css "s3://$BUCKET/styles.css"

echo "Compile & deploy to S3 complete"