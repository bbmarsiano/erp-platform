package prereqs

import (
	"fmt"
	"os/exec"
	"runtime"
	"strings"
)

type Status string

const (
	StatusOK      Status = "ok"
	StatusMissing Status = "missing"
	StatusOldVer  Status = "old_version"
	StatusAuto    Status = "auto"
)

type Prereq struct {
	Name           string `json:"name"`
	Required       string `json:"required"`
	Found          string `json:"found"`
	Status         Status `json:"status"`
	InstallURL     string `json:"installUrl"`
	InstallCmd     string `json:"installCmd"`
	CanAutoInstall bool   `json:"canAutoInstall"`
}

func Check() []Prereq {
	return []Prereq{
		checkNode(),
		checkPnpm(),
		checkPostgres(),
	}
}

func AllReady(prereqs []Prereq) bool {
	for _, p := range prereqs {
		if p.Status == StatusMissing || p.Status == StatusOldVer {
			if !p.CanAutoInstall {
				return false
			}
		}
	}
	return true
}

func checkNode() Prereq {
	p := Prereq{
		Name:       "Node.js",
		Required:   "v20+",
		InstallURL: "https://nodejs.org/en/download",
	}
	out, err := exec.Command("node", "--version").Output()
	if err != nil {
		p.Found = "не е намерен"
		p.Status = StatusMissing
		p.CanAutoInstall = false
		return p
	}
	version := strings.TrimPrefix(strings.TrimSpace(string(out)), "v")
	p.Found = "v" + version
	major := 0
	fmt.Sscanf(strings.Split(version, ".")[0], "%d", &major)
	if major < 20 {
		p.Status = StatusOldVer
		p.CanAutoInstall = false
		return p
	}
	p.Status = StatusOK
	return p
}

func checkPnpm() Prereq {
	p := Prereq{
		Name:     "pnpm",
		Required: "v9+",
	}
	out, err := exec.Command("pnpm", "--version").Output()
	if err != nil {
		p.Found = "не е намерен"
		p.Status = StatusAuto
		p.CanAutoInstall = true
		p.InstallCmd = "npm install -g pnpm"
		return p
	}
	p.Found = "v" + strings.TrimSpace(string(out))
	p.Status = StatusOK
	return p
}

func checkPostgres() Prereq {
	p := Prereq{
		Name:       "PostgreSQL",
		Required:   "v14+",
		InstallURL: "https://www.postgresql.org/download/",
	}
	out, err := exec.Command("psql", "--version").Output()
	if err != nil {
		p.Found = "не е намерен"
		p.Status = StatusMissing
		p.CanAutoInstall = false
		switch runtime.GOOS {
		case "darwin":
			p.InstallCmd = "brew install postgresql@16"
			p.CanAutoInstall = true
		case "linux":
			p.InstallCmd = "apt-get install -y postgresql-16"
			p.CanAutoInstall = true
		case "windows":
			p.InstallURL = "https://www.postgresql.org/download/windows/"
			p.CanAutoInstall = false
		}
		return p
	}
	p.Found = strings.TrimSpace(string(out))
	p.Status = StatusOK
	return p
}
