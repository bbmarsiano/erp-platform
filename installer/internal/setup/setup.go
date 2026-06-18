package setup

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/bbmarsiano/erp-platform/installer/internal/config"
	"github.com/bbmarsiano/erp-platform/installer/internal/prismacli"
	"github.com/bbmarsiano/erp-platform/installer/internal/service"
	"github.com/bbmarsiano/erp-platform/installer/internal/tsxcli"
)

func Run(cfg *config.InstallConfig) error {
	if err := createDatabase(cfg); err != nil {
		return fmt.Errorf("create database: %w", err)
	}

	cfg.JWTSecret = generateSecret(32)
	jwtRefreshSecret := generateSecret(32)

	if err := WriteEnv(cfg, jwtRefreshSecret); err != nil {
		return err
	}

	fmt.Println("  Running database migrations...")
	return prismacli.RunMigrateDeploy(cfg.InstallPath, cfg.DatabaseURL())
}

func WriteEnv(cfg *config.InstallConfig, jwtRefreshSecret string) error {
	serverHost := cfg.ServerHost
	if serverHost == "" {
		serverHost = "0.0.0.0"
	}

	apiURLHost := serverHost
	if apiURLHost == "0.0.0.0" {
		apiURLHost = "localhost"
	}

	envPath := filepath.Join(cfg.InstallPath, ".env")
	if jwtRefreshSecret == "" || cfg.JWTSecret == "" {
		if data, err := os.ReadFile(envPath); err == nil {
			for _, line := range strings.Split(string(data), "\n") {
				if cfg.JWTSecret == "" && strings.HasPrefix(line, "JWT_SECRET=") {
					cfg.JWTSecret = strings.TrimPrefix(line, "JWT_SECRET=")
				}
				if jwtRefreshSecret == "" && strings.HasPrefix(line, "JWT_REFRESH_SECRET=") {
					jwtRefreshSecret = strings.TrimPrefix(line, "JWT_REFRESH_SECRET=")
				}
			}
		}
	}
	if cfg.JWTSecret == "" {
		cfg.JWTSecret = generateSecret(32)
	}
	if jwtRefreshSecret == "" {
		jwtRefreshSecret = generateSecret(32)
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
COMPANY_NAME=%s
ADMIN_EMAIL=%s
ADMIN_PASSWORD=%s
`, cfg.DatabaseURL(), cfg.JWTSecret, jwtRefreshSecret, cfg.LicenseKey, cfg.Port, serverHost, apiURLHost, cfg.Port,
		cfg.CompanyName, cfg.AdminEmail, cfg.AdminPass)

	if err := os.WriteFile(envPath, []byte(envContent), 0o600); err != nil {
		return fmt.Errorf("write .env: %w", err)
	}
	return nil
}

func createDatabase(cfg *config.InstallConfig) error {
	port := fmt.Sprintf("%d", cfg.PgConfig.Port)
	cmds := [][]string{
		{"psql", "-h", "localhost", "-p", port, "-U", "postgres", "-c",
			fmt.Sprintf("CREATE USER %s WITH PASSWORD '%s';",
				cfg.PgConfig.User, cfg.PgConfig.Password)},
		{"psql", "-h", "localhost", "-p", port, "-U", "postgres", "-c",
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
	return tsxcli.RunScript(cfg.InstallPath, seedPath, cfg.DatabaseURL(), map[string]string{
		"COMPANY_NAME":    cfg.CompanyName,
		"ADMIN_EMAIL":     cfg.AdminEmail,
		"ADMIN_PASSWORD":  cfg.AdminPass,
		"LICENSE_KEY":     cfg.LicenseKey,
	})
}

func StartService(cfg *config.InstallConfig) {
	_ = service.Register(cfg)
	_ = service.Start(cfg)
}

