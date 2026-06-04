package main

import (
	"fmt"
	"os"
	"runtime"

	"github.com/bbmarsiano/erp-platform/installer/internal/config"
	"github.com/bbmarsiano/erp-platform/installer/internal/engine"
	"github.com/bbmarsiano/erp-platform/installer/internal/license"
	"github.com/bbmarsiano/erp-platform/installer/internal/postgres"
	"github.com/bbmarsiano/erp-platform/installer/internal/setup"
	"github.com/bbmarsiano/erp-platform/installer/internal/wizard"
	"github.com/fatih/color"
)

var VERSION = "0.1.0"

const LICENSE_SERVER = "https://lvhraynmvyvancqyezef.supabase.co"
const GITHUB_REPO = "bbmarsiano/erp-platform"

func main() {
	printBanner()
	licenseKey := promptInput("Enter your license key")
	if licenseKey == "" {
		exitWithError("License key is required")
	}

	color.Cyan("\n[1/5] Validating license...")
	features, err := license.Validate(LICENSE_SERVER, licenseKey)
	if err != nil {
		exitWithError("License validation failed: %v", err)
	}
	color.Green("✓ License valid. Features: %v", features)

	color.Cyan("\n[2/5] Checking PostgreSQL...")
	pgConfig, err := postgres.EnsureInstalled()
	if err != nil {
		exitWithError("PostgreSQL setup failed: %v", err)
	}
	color.Green("✓ PostgreSQL ready at port %d", pgConfig.Port)

	color.Cyan("\n[3/5] Downloading DFlowERP engine v%s...", VERSION)
	installPath, err := engine.Download(GITHUB_REPO, VERSION)
	if err != nil {
		exitWithError("Download failed: %v", err)
	}
	color.Green("✓ Engine installed to %s", installPath)

	color.Cyan("\n[4/5] Setting up database...")
	cfg := &config.InstallConfig{
		LicenseKey:  licenseKey,
		Features:    features,
		InstallPath: installPath,
		PgConfig:    pgConfig,
		Port:        3001,
	}
	if err := setup.Run(cfg); err != nil {
		exitWithError("Setup failed: %v", err)
	}
	color.Green("✓ Database configured")

	color.Cyan("\n[5/5] Opening onboarding wizard...")
	color.Yellow("  Browser will open automatically at http://localhost:7788")
	if err := wizard.Launch(cfg); err != nil {
		exitWithError("Wizard failed: %v", err)
	}
}

func exitWithError(format string, args ...interface{}) {
	color.Red("✗ "+fmt.Sprintf(format, args...))
	if runtime.GOOS == "windows" {
		color.Yellow("\nPress Enter to exit...")
		var line string
		fmt.Scanln(&line)
	}
	os.Exit(1)
}

func printBanner() {
	color.Blue("\n╔═══════════════════════════════╗")
	color.Blue("║     DFlowERP Installer        ║")
	color.Blue("║     v%-25s║", VERSION+" ")
	color.Blue("╚═══════════════════════════════╝\n")
}

func promptInput(label string) string {
	fmt.Printf("%s: ", label)
	var input string
	fmt.Scanln(&input)
	return input
}
