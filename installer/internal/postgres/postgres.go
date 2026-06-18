package postgres

import (
	"database/sql"
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"strconv"

	"github.com/bbmarsiano/erp-platform/installer/internal/config"
	_ "github.com/lib/pq"
)

var commonPorts = []string{"5432", "5433", "5434"}

func EnsureInstalled() (*config.PgConfig, error) {
	if cfg, err := detectRunning(); err == nil {
		fmt.Println("  Found existing PostgreSQL installation")
		return cfg, nil
	}

	fmt.Printf("  PostgreSQL not found. Installing for %s...\n", runtime.GOOS)
	if err := install(); err != nil {
		return nil, err
	}

	port, err := DetectPort()
	if err != nil {
		return nil, err
	}

	cfg := defaultConfig()
	cfg.Port = port
	return cfg, nil
}

// DetectPort tries common PostgreSQL ports and returns the first that responds.
func DetectPort() (int, error) {
	for _, portStr := range commonPorts {
		connStr := fmt.Sprintf("host=localhost port=%s user=postgres sslmode=disable", portStr)
		db, err := sql.Open("postgres", connStr)
		if err != nil {
			continue
		}
		if err := db.Ping(); err == nil {
			_ = db.Close()
			fmt.Printf("  Found PostgreSQL on port %s\n", portStr)
			port, _ := strconv.Atoi(portStr)
			return port, nil
		}
		_ = db.Close()
	}
	return 0, fmt.Errorf("PostgreSQL not found on ports 5432, 5433, 5434")
}

func detectRunning() (*config.PgConfig, error) {
	out, err := exec.Command("psql", "--version").Output()
	if err != nil {
		return nil, fmt.Errorf("psql not found")
	}
	_ = out

	port, err := DetectPort()
	if err != nil {
		return nil, err
	}

	cfg := defaultConfig()
	cfg.Port = port
	return cfg, nil
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
