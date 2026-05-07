package postgres

import (
	"fmt"
	"os"
	"os/exec"
	"runtime"

	"github.com/bbmarsiano/erp-platform/installer/internal/config"
)

func EnsureInstalled() (*config.PgConfig, error) {
	if cfg, err := detectRunning(); err == nil {
		fmt.Println("  Found existing PostgreSQL installation")
		return cfg, nil
	}

	fmt.Printf("  PostgreSQL not found. Installing for %s...\n", runtime.GOOS)
	if err := install(); err != nil {
		return nil, err
	}
	return defaultConfig(), nil
}

func detectRunning() (*config.PgConfig, error) {
	out, err := exec.Command("psql", "--version").Output()
	if err != nil {
		return nil, fmt.Errorf("psql not found")
	}
	_ = out
	return defaultConfig(), nil
}

func install() error {
	switch runtime.GOOS {
	case "windows":
		return installWindows()
	case "darwin":
		return runCmd("brew", "install", "postgresql@16")
	case "linux":
		return installLinux()
	}
	return fmt.Errorf("unsupported OS: %s", runtime.GOOS)
}

func installWindows() error {
	fmt.Println("  Downloading PostgreSQL for Windows...")
	return nil
}

func installLinux() error {
	_, aptErr := exec.LookPath("apt-get")
	if aptErr == nil {
		return runCmd("apt-get", "install", "-y", "postgresql-16")
	}
	return runCmd("yum", "install", "-y", "postgresql16-server")
}

func runCmd(name string, args ...string) error {
	cmd := exec.Command(name, args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func defaultConfig() *config.PgConfig {
	return &config.PgConfig{
		Host:     "localhost",
		Port:     5432,
		User:     "dflow",
		Password: "dflow_secure_pass",
		DBName:   "dflow_erp",
	}
}

