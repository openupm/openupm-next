# @openupm/server-common

The library contains utils that are shared between Node.js apps.

## Jobs

### Remove packages without releases

```
npx checkPackage release > packages-norelease.txt
cat packages-norelease.txt | while read line; do
  packageName=$(echo $line | json packageName)
  echo $packageName
  mv "/data/openupm-data/packages/${packageName}.yml" "/data/openupm-data/packages-norelease/${packageName}.yml"
done
rm -f packages-norelease.txt
```