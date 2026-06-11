package updater

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"github.com/bbmarsiano/erp-platform/installer/internal/engine"
	"github.com/bbmarsiano/erp-platform/installer/internal/license"
	"github.com/bbmarsiano/erp-platform/installer/internal/prismacli"
	"github.com/fatih/color"
)

const CURRENT_VERSION = "0.3.0"

func Run(licenseServerURL, licenseKey, githubRepo string) error {
	color.Cyan("\n🔄 DFlowERP Updater")
	color.Cyan("══════════════════════════════")

	color.Cyan("\n[1/5] Проверка на разрешена версия...")
	features, allowedVersion, err := license.ValidateWithVersion(licenseServerURL, licenseKey)
	if err != nil {
		return fmt.Errorf("license check failed: %w", err)
	}
	_ = features

	if allowedVersion == "" || allowedVersion == "null" {
		color.Yellow("✓ Няма налично обновление. Текуща версия: v%s", CURRENT_VERSION)
		return nil
	}

	if !isNewerVersion(allowedVersion, CURRENT_VERSION) {
		color.Green("✓ Системата е актуална. Версия: v%s", CURRENT_VERSION)
		return nil
	}

	color.Green("✓ Налично обновление: v%s → v%s", CURRENT_VERSION, allowedVersion)

	installPath := getInstallPath()
	if _, err := os.Stat(installPath); os.IsNotExist(err) {
		return fmt.Errorf("инсталационната директория не е намерена: %s", installPath)
	}
	color.Green("✓ Инсталационна директория: %s", installPath)

	color.Cyan("\n[2/5] Четене на конфигурация...")
	envPath := filepath.Join(installPath, ".env")
	dbURL, err := readEnvVar(envPath, "DATABASE_URL")
	if err != nil {
		return fmt.Errorf("не може да се прочете DATABASE_URL: %w", err)
	}
	color.Green("✓ База данни конфигурирана")

	color.Cyan("\n[3/5] Backup на базата данни...")
	backupPath, err := backupDatabase(dbURL, installPath, CURRENT_VERSION)
	if err != nil {
		return fmt.Errorf("backup неуспешен: %w", err)
	}
	color.Green("✓ Backup записан: %s", backupPath)

	color.Cyan("\n[4/5] Изтегляне на v%s...", allowedVersion)
	_, err = engine.Download(githubRepo, allowedVersion)
	if err != nil {
		color.Red("✗ Изтеглянето неуспя. Rollback...")
		rollback(backupPath, dbURL)
		return fmt.Errorf("download failed: %w", err)
	}
	color.Green("✓ Engine v%s изтеглен", allowedVersion)

	color.Cyan("\n[5/5] Прилагане на миграции...")
	if err := runMigrations(installPath, dbURL); err != nil {
		color.Red("✗ Миграциите неуспяха. Rollback...")
		rollback(backupPath, dbURL)
		return fmt.Errorf("migrations failed: %w", err)
	}
	color.Green("✓ Миграциите приложени")

	versionFile := filepath.Join(os.Getenv("HOME"), ".dflow", "version")
	_ = os.MkdirAll(filepath.Dir(versionFile), 0o755)
	_ = os.WriteFile(versionFile, []byte(allowedVersion), 0o644)

	color.Green("\n╔══════════════════════════════════╗")
	color.Green("║  ✅ Обновлението е завършено!     ║")
	color.Green("║  DFlowERP v%-22s║", allowedVersion+" ")
	color.Green("╚══════════════════════════════════╝")
	color.Yellow("\nМоля рестартирайте DFlowERP за да влязат в сила промените.")

	return nil
}

func isNewerVersion(a, b string) bool {
	pa := strings.Split(strings.TrimPrefix(a, "v"), ".")
	pb := strings.Split(strings.TrimPrefix(b, "v"), ".")
	for i := 0; i < 3; i++ {
		var na, nb int
		if i < len(pa) {
			_, _ = fmt.Sscanf(pa[i], "%d", &na)
		}
		if i < len(pb) {
			_, _ = fmt.Sscanf(pb[i], "%d", &nb)
		}
		if na > nb {
			return true
		}
		if na < nb {
			return false
		}
	}
	return false
}

func getInstallPath() string {
	switch runtime.GOOS {
	case "windows":
		return filepath.Join(os.Getenv("PROGRAMFILES"), "DFlowERP")
	case "darwin":
		return filepath.Join(os.Getenv("HOME"), "Applications", "DFlowERP")
	default:
		return "/opt/dflow-erp"
	}
}

func readEnvVar(envPath, key string) (string, error) {
	data, err := os.ReadFile(envPath)
	if err != nil {
		return "", err
	}
	for _, line := range strings.Split(string(data), "\n") {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, key+"=") {
			val := strings.TrimPrefix(line, key+"=")
			val = strings.Trim(val, `"'`)
			return val, nil
		}
	}
	return "", fmt.Errorf("key %s not found in %s", key, envPath)
}

func backupDatabase(dbURL, installPath, version string) (string, error) {
	backupDir := filepath.Join(installPath, "backups")
	_ = os.MkdirAll(backupDir, 0o755)

	timestamp := time.Now().Format("20060102-150405")
	backupFile := filepath.Join(backupDir, fmt.Sprintf("backup-v%s-%s.sql", version, timestamp))

	cmd := exec.Command("pg_dump", dbURL, "-f", backupFile, "--no-password")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("pg_dump failed: %w", err)
	}
	return backupFile, nil
}

func runMigrations(installPath, dbURL string) error {
	return prismacli.RunMigrateDeploy(installPath, dbURL)
}

func rollback(backupPath, dbURL string) {
	color.Yellow("Rollback: възстановяване от backup %s...", backupPath)
	cmd := exec.Command("psql", dbURL, "-f", backupPath, "--no-password")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		color.Red("Rollback неуспешен: %v", err)
		color.Red("Ръчно възстановяване: psql $DATABASE_URL -f %s", backupPath)
	} else {
		color.Green("✓ Rollback успешен")
	}
}
