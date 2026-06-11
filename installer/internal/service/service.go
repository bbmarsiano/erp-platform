package service

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"

	"github.com/bbmarsiano/erp-platform/installer/internal/config"
)

func Register(cfg *config.InstallConfig) error {
	fmt.Printf("  Registering DFlowERP service for %s at %s\n", runtime.GOOS, cfg.InstallPath)
	return nil
}

func Start(cfg *config.InstallConfig) error {
	serverJS := filepath.Join(cfg.InstallPath, "apps", "api", "dist", "server.js")
	fmt.Printf("  Starting DFlowERP API (node) on port %d\n", cfg.Port)

	cmd := exec.Command("node", serverJS)
	cmd.Dir = cfg.InstallPath
	cmd.Env = envWithDotEnv(cfg)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("start API server: %w", err)
	}
	return nil
}

func envWithDotEnv(cfg *config.InstallConfig) []string {
	env := os.Environ()
	envPath := filepath.Join(cfg.InstallPath, ".env")
	data, err := os.ReadFile(envPath)
	if err != nil {
		return append(env,
			"DATABASE_URL="+cfg.DatabaseURL(),
			"PORT="+strconv.Itoa(cfg.Port),
			"NODE_ENV=production",
		)
	}
	for _, line := range strings.Split(string(data), "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		key, val, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		env = setEnv(env, strings.TrimSpace(key), strings.Trim(val, `"'`))
	}
	env = setEnv(env, "PORT", strconv.Itoa(cfg.Port))
	return env
}

func setEnv(env []string, key, val string) []string {
	prefix := key + "="
	for i, e := range env {
		if strings.HasPrefix(e, prefix) {
			env[i] = prefix + val
			return env
		}
	}
	return append(env, prefix+val)
}
