package service

import (
	"fmt"
	"runtime"

	"github.com/bbmarsiano/erp-platform/installer/internal/config"
)

func Register(cfg *config.InstallConfig) error {
	fmt.Printf("  Registering DFlowERP service for %s at %s\n", runtime.GOOS, cfg.InstallPath)
	return nil
}

func Start(cfg *config.InstallConfig) error {
	fmt.Printf("  Starting DFlowERP service on port %d\n", cfg.Port)
	return nil
}

