#!/bin/bash
cd "$(dirname "$0")"

KEY=$(ls *.txt | grep -vE "llms|robots" | head -1 | sed 's/\.txt$//')
HOST="www.wellvalet.com"

if [ -z "$KEY" ]; then
  echo "No IndexNow key file found."
  exit 1
fi

URLS=$(grep -o "<loc>[^<]*" sitemap.xml | sed 's/<loc>//' \
       | sed 's/^/    "/;s/$/",/' | sed '$ s/,$//')

cat > /tmp/indexnow.json <<JSON
{
  "host": "$HOST",
  "key": "$KEY",
  "keyLocation": "https://$HOST/$KEY.txt",
  "urlList": [
$URLS
  ]
}
JSON

echo "Submitting $(grep -c '<loc>' sitemap.xml) URLs to IndexNow..."
curl -s -X POST "https://api.indexnow.org/indexnow" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d @/tmp/indexnow.json \
  -o /dev/null -w "Response: %{http_code}\n"

rm -f /tmp/indexnow.json
