VERSION ?= 0.1.0

# Production builds (no dev flags)
build-all: build-windows build-mac-arm build-mac-intel build-linux

build-windows:
	GOOS=windows GOARCH=amd64 go build \
	  -ldflags="-s -w -X main.VERSION=$(VERSION)" \
	  -o dist/dflow-installer-windows-amd64.exe .

build-mac-arm:
	GOOS=darwin GOARCH=arm64 go build \
	  -ldflags="-s -w -X main.VERSION=$(VERSION)" \
	  -o dist/dflow-installer-darwin-arm64 .

build-mac-intel:
	GOOS=darwin GOARCH=amd64 go build \
	  -ldflags="-s -w -X main.VERSION=$(VERSION)" \
	  -o dist/dflow-installer-darwin-amd64 .

build-linux:
	GOOS=linux GOARCH=amd64 go build \
	  -ldflags="-s -w -X main.VERSION=$(VERSION)" \
	  -o dist/dflow-installer-linux-amd64 .

# Dev build — includes --wizard-only flag
build-dev:
	go build -tags dev -o dist/dflow-installer-dev .

# Local production build (current platform)
build:
	go build -ldflags="-X main.VERSION=$(VERSION)" -o dist/dflow-installer .

clean:
	rm -rf dist/

