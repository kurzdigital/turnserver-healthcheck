from node:10 as build

workdir /app

copy . .

run make

expose 3000

cmd ["node", "."]
