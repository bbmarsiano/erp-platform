package setup

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/bbmarsiano/erp-platform/installer/internal/config"
	"github.com/bbmarsiano/erp-platform/installer/internal/service"
)

func Run(cfg *config.InstallConfig) error {
	if err := createDatabase(cfg); err != nil {
		return fmt.Errorf("create database: %w", err)
	}

	cfg.JWTSecret = generateSecret(32)
	jwtRefreshSecret := generateSecret(32)

	serverHost := cfg.ServerHost
	if serverHost == "" {
		serverHost = "0.0.0.0"
	}

	apiURLHost := serverHost
	if apiURLHost == "0.0.0.0" {
		apiURLHost = "localhost"
	}

	envContent := fmt.Sprintf(`DATABASE_URL=%s
JWT_SECRET=%s
JWT_REFRESH_SECRET=%s
LICENSE_KEY=%s
LICENSE_SERVER_URL=https://lvhraynmvyvancqyezef.supabase.co
NODE_ENV=production
PORT=%d
API_HOST=%s
VITE_API_URL=http://%s:%d
`, cfg.DatabaseURL(), cfg.JWTSecret, jwtRefreshSecret, cfg.LicenseKey, cfg.Port, serverHost, apiURLHost, cfg.Port)

	envPath := filepath.Join(cfg.InstallPath, ".env")
	if err := os.WriteFile(envPath, []byte(envContent), 0o600); err != nil {
		return fmt.Errorf("write .env: %w", err)
	}

	fmt.Println("  Running database migrations...")
	cmd := exec.Command("node", filepath.Join(cfg.InstallPath, "node_modules/.bin/prisma"),
		"migrate", "deploy",
		"--schema", filepath.Join(cfg.InstallPath, "packages/db/prisma/schema.prisma"))
	cmd.Env = append(os.Environ(), "DATABASE_URL="+cfg.DatabaseURL())
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func createDatabase(cfg *config.InstallConfig) error {
	cmds := [][]string{
		{"psql", "-U", "postgres", "-c",
			fmt.Sprintf("CREATE USER %s WITH PASSWORD '%s';",
				cfg.PgConfig.User, cfg.PgConfig.Password)},
		{"psql", "-U", "postgres", "-c",
			fmt.Sprintf("CREATE DATABASE %s OWNER %s;",
				cfg.PgConfig.DBName, cfg.PgConfig.User)},
	}
	for _, args := range cmds {
		cmd := exec.Command(args[0], args[1:]...)
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		_ = cmd.Run()
	}
	return nil
}

func generateSecret(length int) string {
	b := make([]byte, length)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

func Seed(cfg *config.InstallConfig) error {
	seedPath := filepath.Join(cfg.InstallPath, "packages/db/prisma/seed.ts")
	cmd := exec.Command("node", filepath.Join(cfg.InstallPath, "node_modules/.bin/tsx"), seedPath)
	cmd.Env = append(os.Environ(), "DATABASE_URL="+cfg.DatabaseURL())
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func StartService(cfg *config.InstallConfig) {
	_ = service.Register(cfg)
	_ = service.Start(cfg)
}

