VERSION=0.1.0

build-all: build-windows build-mac build-linux

build-windows:
	GOOS=windows GOARCH=amd64 go build -ldflags="-s -w" -o dist/dflow-installer-windows-amd64.exe .

build-mac:
	GOOS=darwin GOARCH=arm64 go build -ldflags="-s -w" -o dist/dflow-installer-darwin-arm64 .
	GOOS=darwin GOARCH=amd64 go build -ldflags="-s -w" -o dist/dflow-installer-darwin-amd64 .

build-linux:
	GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o dist/dflow-installer-linux-amd64 .

clean:
	rm -rf dist/

