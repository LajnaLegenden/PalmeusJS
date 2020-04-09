docker stop "palmeusJS"
docker rm "palmeusJS"
docker build . -t palmeusjs:latest
docker run --name "palmeusJS" -d --network host palmeusjs:latest
