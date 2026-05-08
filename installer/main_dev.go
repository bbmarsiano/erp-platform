//go:build dev

package main

import (
	"flag"

	"github.com/bbmarsiano/erp-platform/installer/internal/config"
	"github.com/bbmarsiano/erp-platform/installer/internal/wizard"
	"github.com/fatih/color"
)

func init() {
	wizardOnly := flag.Bool("wizard-only", false, "Launch wizard UI only (dev testing)")
	flag.Parse()

	if *wizardOnly {
		cfg := &config.InstallConfig{
			LicenseKey:  "TEST-KEY",
			Features:    []string{"module:wms", "module:mes", "module:scm", "module:pos", "module:backup"},
			InstallPath: "/tmp/dflow-test",
			Port:        3001,
			PgConfig: &config.PgConfig{
				Host:     "localhost",
				Port:     5432,
				User:     "test",
				Password: "test",
				DBName:   "dflow_test",
			},
		}
		color.Green("Starting wizard in DEV mode at http://localhost:7788")
		if err := wizard.LaunchTestMode(cfg); err != nil {
			color.Red("✗ Wizard DEV mode failed: %v", err)
		}
		panic("wizard-only mode exit")
	}
}

