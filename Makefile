

build: install
	yarn build

install:
	yarn install

docker: build
	docker build .
