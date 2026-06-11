package tsxcli

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
)

const npxFallback = "npx"

// ResolvePath finds the tsx binary/script under installPath.
func ResolvePath(installPath string) string {
	candidates := []string{
		filepath.Join(installPath, "node_modules", ".bin", "tsx"),
		filepath.Join(installPath, "node_modules", ".pnpm", "node_modules", ".bin", "tsx"),
		filepath.Join(installPath, "node_modules", ".pnpm", "tsx@4.19.3", "node_modules", "tsx", "dist", "cli.mjs"),
	}

	if runtime.GOOS == "windows" {
		winCandidates := make([]string, 0, len(candidates)*2)
		for _, c := range candidates {
			if strings.HasSuffix(c, ".mjs") {
				winCandidates = append(winCandidates, c)
			} else {
				winCandidates = append(winCandidates, c+".cmd", c)
			}
		}
		candidates = winCandidates
	}

	for _, candidate := range candidates {
		if _, err := os.Stat(candidate); err == nil {
			return candidate
		}
	}
	return npxFallback
}

// RunScript executes a TypeScript file via tsx.
func RunScript(installPath, scriptPath, dbURL string) error {
	tsxPath := ResolvePath(installPath)
	fmt.Printf("  tsx path: %s\n", tsxPath)

	var cmd *exec.Cmd
	switch {
	case tsxPath == npxFallback:
		cmd = exec.Command("npx", "tsx", scriptPath)
	case strings.HasSuffix(tsxPath, ".mjs"):
		cmd = exec.Command("node", tsxPath, scriptPath)
	default:
		cmd = exec.Command(tsxPath, scriptPath)
	}

	cmd.Dir = installPath
	cmd.Env = append(os.Environ(), "DATABASE_URL="+dbURL)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}
