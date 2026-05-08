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

var VERSION = "0.1.0"

const LICENSE_SERVER = "https://lvhraynmvyvancqyezef.supabase.co"
const GITHUB_REPO = "bbmarsiano/erp-platform"

func main() {
	printBanner()
	licenseKey := promptInput("Enter your license key")
	if licenseKey == "" {
		color.Red("✗ License key is required")
		os.Exit(1)
	}

	// Step 1: Validate license
	color.Cyan("\n[1/5] Validating license...")
	features, err := license.Validate(LICENSE_SERVER, licenseKey)
	if err != nil {
		color.Red("✗ License validation failed: %v", err)
		os.Exit(1)
	}
	color.Green("✓ License valid. Features: %v", features)

	// Step 2: PostgreSQL
	color.Cyan("\n[2/5] Checking PostgreSQL...")
	pgConfig, err := postgres.EnsureInstalled()
	if err != nil {
		color.Red("✗ PostgreSQL setup failed: %v", err)
		os.Exit(1)
	}
	color.Green("✓ PostgreSQL ready at port %d", pgConfig.Port)

	// Step 3: Download engine
	color.Cyan("\n[3/5] Downloading DFlowERP engine v%s...", VERSION)
	installPath, err := engine.Download(GITHUB_REPO, VERSION)
	if err != nil {
		color.Red("✗ Download failed: %v", err)
		os.Exit(1)
	}
	color.Green("✓ Engine installed to %s", installPath)

	// Step 4: Setup DB + config
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
	color.Green("✓ Database configured")

	// Step 5: Onboarding wizard
	color.Cyan("\n[5/5] Opening onboarding wizard...")
	color.Yellow("  Browser will open automatically at http://localhost:7788")
	if err := wizard.Launch(cfg); err != nil {
		color.Red("✗ Wizard failed: %v", err)
		os.Exit(1)
	}
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

