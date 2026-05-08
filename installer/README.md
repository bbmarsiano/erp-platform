# DFlowERP Installer

## For end users (clients)
Download the installer for your platform from:
https://github.com/bbmarsiano/erp-platform/releases

### Windows
1. Download `dflow-installer-windows-amd64.exe`
2. Run as Administrator
3. Enter your license key when prompted
4. Follow the onboarding wizard

### Mac
1. Download `dflow-installer-darwin-arm64` (Apple Silicon) or `dflow-installer-darwin-amd64` (Intel)
2. `chmod +x dflow-installer-darwin-arm64`
3. `./dflow-installer-darwin-arm64`
4. Enter your license key and follow the wizard

### Linux
1. Download `dflow-installer-linux-amd64`
2. `chmod +x dflow-installer-linux-amd64`
3. `sudo ./dflow-installer-linux-amd64`
4. Enter your license key and follow the wizard

## For developers (dev testing)
```bash
cd installer
# Build dev version with --wizard-only flag
make build-dev
# Test wizard UI without full install
./dist/dflow-installer-dev --wizard-only
```

Build all platforms
```bash
make build-all VERSION=0.1.0
```

