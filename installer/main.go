package main

import (
	"fmt"
	"os"

	"github.com/bbmarsiano/erp-platform/installer/internal/config"
	"github.com/bbmarsiano/erp-platform/installer/internal/engine"
	"github.com/bbmarsiano/erp-platform/installer/internal/license"
	"github.com/bbmarsiano/erp-platform/installer/internal/postgres"
	"github.com/bbmarsiano/erp-platform/installer/internal/setup"
	"github.com/bbmarsiano/erp-platform/installer/internal/wizard"
	"github.com/fatih/color"
)

const VERSION = "0.1.0"
const LICENSE_SERVER = "https://YOUR_PROJECT.supabase.co"
const GITHUB_REPO = "bbmarsiano/erp-platform"

func main() {
	printBanner()

	licenseKey := promptLicenseKey()

	color.Cyan("\n[1/5] Validating license...")
	features, err := license.Validate(LICENSE_SERVER, licenseKey)
	if err != nil {
		color.Red("✗ License validation failed: %v", err)
		os.Exit(1)
	}
	color.Green("✓ License valid. Features: %v", features)

	color.Cyan("\n[2/5] Checking PostgreSQL...")
	pgConfig, err := postgres.EnsureInstalled()
	if err != nil {
		color.Red("✗ PostgreSQL setup failed: %v", err)
		os.Exit(1)
	}
	color.Green("✓ PostgreSQL ready at port %d", pgConfig.Port)

	color.Cyan("\n[3/5] Downloading DFlowERP engine...")
	installPath, err := engine.Download(GITHUB_REPO, VERSION)
	if err != nil {
		color.Red("✗ Download failed: %v", err)
		os.Exit(1)
	}
	color.Green("✓ Engine downloaded to %s", installPath)

	color.Cyan("\n[4/5] Setting up database...")
	cfg := &config.InstallConfig{
		LicenseKey:  licenseKey,
		Features:    features,
		InstallPath: installPath,
		PgConfig:    pgConfig,
		Port:        3001,
	}
	if err := setup.Run(cfg); err != nil {
		color.Red("✗ Setup failed: %v", err)
		os.Exit(1)
	}
	color.Green("✓ Database ready")

	color.Cyan("\n[5/5] Starting onboarding wizard...")
	if err := wizard.Launch(cfg); err != nil {
		color.Red("✗ Wizard failed: %v", err)
		os.Exit(1)
	}
}

func printBanner() {
	color.Blue(`
 ____  Flow ERP
|  _ \ Flow
| | | |Flow  Installer v%s
|_| |_|Flow

`, VERSION)
	fmt.Println("DFlowERP Installer v" + VERSION)
	fmt.Println("------------------------------")
}

func promptLicenseKey() string {
	fmt.Print("\nEnter your license key: ")
	var key string
	fmt.Scanln(&key)
	return key
}

