package prismacli

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
)

const npxFallback = "npx"

// ResolvePath finds the prisma binary/script under installPath.
// Returns "npx" if no candidate exists (caller runs via npx prisma).
func ResolvePath(installPath string) string {
	candidates := []string{
		filepath.Join(installPath, "node_modules", ".bin", "prisma"),
		filepath.Join(installPath, "packages", "db", "node_modules", ".bin", "prisma"),
		filepath.Join(installPath, "node_modules", ".pnpm", "prisma@5.22.0", "node_modules", "prisma", "build", "index.js"),
	}

	if runtime.GOOS == "windows" {
		winCandidates := make([]string, 0, len(candidates)*2)
		for _, c := range candidates {
			if strings.HasSuffix(c, ".js") {
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

// SchemaPath returns the default Prisma schema location in an engine install.
func SchemaPath(installPath string) string {
	return filepath.Join(installPath, "packages", "db", "prisma", "schema.prisma")
}

// RunMigrateDeploy runs prisma migrate deploy using the resolved binary path.
func RunMigrateDeploy(installPath, dbURL string) error {
	schemaPath := SchemaPath(installPath)
	prismaPath := ResolvePath(installPath)
	fmt.Printf("  Prisma path: %s\n", prismaPath)

	var cmd *exec.Cmd
	switch {
	case prismaPath == npxFallback:
		cmd = exec.Command("npx", "prisma", "migrate", "deploy", "--schema", schemaPath)
	case strings.HasSuffix(prismaPath, ".js"):
		cmd = exec.Command("node", prismaPath, "migrate", "deploy", "--schema", schemaPath)
	default:
		cmd = exec.Command(prismaPath, "migrate", "deploy", "--schema", schemaPath)
	}

	cmd.Env = append(os.Environ(), "DATABASE_URL="+dbURL)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}
