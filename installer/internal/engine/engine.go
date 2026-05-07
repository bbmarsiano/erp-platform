package engine

import (
	"archive/zip"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strings"

	"github.com/schollz/progressbar/v3"
)

const RELEASE_URL = "https://github.com/%s/releases/download/v%s/dflow-erp-%s-%s.zip"

func Download(repo, version string) (string, error) {
	osName := runtime.GOOS
	arch := runtime.GOARCH

	url := fmt.Sprintf(RELEASE_URL, repo, version, osName, arch)
	installPath := getInstallPath()

	fmt.Printf("  Downloading from: %s\n", url)

	if err := os.MkdirAll(installPath, 0o755); err != nil {
		return "", err
	}

	zipPath := filepath.Join(os.TempDir(), "dflow-engine.zip")
	if err := downloadWithProgress(url, zipPath); err != nil {
		return "", fmt.Errorf("download failed: %w", err)
	}

	if err := extractZip(zipPath, installPath); err != nil {
		return "", fmt.Errorf("extraction failed: %w", err)
	}

	return installPath, nil
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

	if resp.StatusCode < 200 || resp.StatusCode > 299 {
		return fmt.Errorf("download returned status %s", resp.Status)
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
		cleanDest := filepath.Clean(dest) + string(os.PathSeparator)
		if !strings.HasPrefix(filepath.Clean(destPath), cleanDest) {
			continue
		}
		if f.FileInfo().IsDir() {
			if err := os.MkdirAll(destPath, f.Mode()); err != nil {
				return err
			}
			continue
		}
		if err := os.MkdirAll(filepath.Dir(destPath), 0o755); err != nil {
			return err
		}
		in, err := f.Open()
		if err != nil {
			return err
		}
		out, err := os.OpenFile(destPath, os.O_CREATE|os.O_TRUNC|os.O_WRONLY, f.Mode())
		if err != nil {
			_ = in.Close()
			return err
		}
		_, copyErr := io.Copy(out, in)
		_ = out.Close()
		_ = in.Close()
		if copyErr != nil {
			return copyErr
		}
	}
	return nil
}

