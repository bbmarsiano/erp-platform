package engine

import (
	"archive/zip"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"

	"github.com/schollz/progressbar/v3"
)

// Engine is platform-independent (Node.js runs on all platforms)
// Only one ZIP needed — not per-platform like the installer binary
const RELEASE_URL = "https://github.com/%s/releases/download/%s/dflow-engine-%s.zip"

func Download(repo, version string) (string, error) {
	url := fmt.Sprintf(RELEASE_URL, repo, "v"+version+"-engine", version)
	installPath := getInstallPath()

	fmt.Printf("  Downloading engine from:\n  %s\n", url)

	if err := os.MkdirAll(installPath, 0o755); err != nil {
		return "", fmt.Errorf("create install dir: %w", err)
	}

	zipPath := filepath.Join(os.TempDir(), fmt.Sprintf("dflow-engine-%s.zip", version))

	if err := downloadWithProgress(url, zipPath); err != nil {
		return "", fmt.Errorf("download failed: %w", err)
	}

	fmt.Println("  Extracting...")
	if err := ExtractAndInstall(zipPath, version, installPath); err != nil {
		return "", err
	}

	return installPath, nil
}

func DownloadZip(repo, version string) (zipPath, installPath string, err error) {
	url := fmt.Sprintf(RELEASE_URL, repo, "v"+version+"-engine", version)
	installPath = getInstallPath()

	fmt.Printf("  Downloading engine from:\n  %s\n", url)

	if err := os.MkdirAll(installPath, 0o755); err != nil {
		return "", "", fmt.Errorf("create install dir: %w", err)
	}

	zipPath = filepath.Join(os.TempDir(), fmt.Sprintf("dflow-engine-%s.zip", version))

	if err := downloadWithProgress(url, zipPath); err != nil {
		return "", "", fmt.Errorf("download failed: %w", err)
	}

	return zipPath, installPath, nil
}

func ExtractAndInstall(zipPath, version, installPath string) error {
	if err := extractZip(zipPath, installPath); err != nil {
		return fmt.Errorf("extraction failed: %w", err)
	}

	// The ZIP extracts to a subdirectory dflow-engine-VERSION/
	// Move contents up one level
	extractedDir := filepath.Join(installPath, fmt.Sprintf("dflow-engine-%s", version))
	if _, err := os.Stat(extractedDir); err == nil {
		// Move all files from subdirectory to installPath
		if err := moveContents(extractedDir, installPath); err != nil {
			return fmt.Errorf("move contents: %w", err)
		}
		_ = os.RemoveAll(extractedDir)
	}

	// Install Node.js dependencies
	fmt.Println("  Installing dependencies (this may take a few minutes)...")
	if err := installDeps(installPath); err != nil {
		return fmt.Errorf("install deps: %w", err)
	}

	return nil
}

func installDeps(installPath string) error {
	var scriptName string
	if runtime.GOOS == "windows" {
		scriptName = "install-deps.bat"
	} else {
		scriptName = "install-deps.sh"
	}

	scriptPath := filepath.Join(installPath, scriptName)
	if _, err := os.Stat(scriptPath); os.IsNotExist(err) {
		return fmt.Errorf("install-deps script not found at %s", scriptPath)
	}

	var cmd *exec.Cmd
	if runtime.GOOS == "windows" {
		cmd = exec.Command("cmd", "/c", scriptPath)
	} else {
		cmd = exec.Command("bash", scriptPath)
	}
	cmd.Dir = installPath
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
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

func downloadWithProgress(url, destPath string) error {
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return fmt.Errorf("HTTP %d: %s", resp.StatusCode, url)
	}

	f, err := os.Create(destPath)
	if err != nil {
		return err
	}
	defer f.Close()

	bar := progressbar.DefaultBytes(resp.ContentLength, "  Downloading")
	_, err = io.Copy(io.MultiWriter(f, bar), resp.Body)
	return err
}

func extractZip(src, dest string) error {
	r, err := zip.OpenReader(src)
	if err != nil {
		return err
	}
	defer r.Close()

	for _, f := range r.File {
		destPath := filepath.Join(dest, f.Name)
		// Security: prevent path traversal
		if !strings.HasPrefix(filepath.Clean(destPath), filepath.Clean(dest)+string(os.PathSeparator)) {
			continue
		}
		if f.FileInfo().IsDir() {
			_ = os.MkdirAll(destPath, f.Mode())
			continue
		}
		if err := os.MkdirAll(filepath.Dir(destPath), 0o755); err != nil {
			return err
		}
		outFile, err := os.OpenFile(destPath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, f.Mode())
		if err != nil {
			return err
		}
		rc, err := f.Open()
		if err != nil {
			_ = outFile.Close()
			return err
		}
		_, err = io.Copy(outFile, rc)
		_ = outFile.Close()
		_ = rc.Close()
		if err != nil {
			return err
		}
	}
	return nil
}

func moveContents(src, dest string) error {
	entries, err := os.ReadDir(src)
	if err != nil {
		return err
	}

	for _, entry := range entries {
		srcPath := filepath.Join(src, entry.Name())
		destPath := filepath.Join(dest, entry.Name())
		if err := os.Rename(srcPath, destPath); err != nil {
			return fmt.Errorf("move %s: %w", entry.Name(), err)
		}
	}
	return nil
}

