package wizard

import (
	"embed"
	"encoding/json"
	"fmt"
	"net/http"
	"os/exec"
	"runtime"

	"github.com/bbmarsiano/erp-platform/installer/internal/config"
	"github.com/bbmarsiano/erp-platform/installer/internal/setup"
)

//go:embed static/*
var staticFiles embed.FS

func Launch(cfg *config.InstallConfig) error {
	mux := http.NewServeMux()

	mux.Handle("/", http.FileServer(http.FS(staticFiles)))

	mux.HandleFunc("/api/complete", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		var body struct {
			CompanyName string `json:"companyName"`
			AdminEmail  string `json:"adminEmail"`
			AdminPass   string `json:"adminPass"`
			Port        int    `json:"port"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, "Bad request", http.StatusBadRequest)
			return
		}

		cfg.CompanyName = body.CompanyName
		cfg.AdminEmail = body.AdminEmail
		cfg.AdminPass = body.AdminPass
		cfg.Port = body.Port

		if err := setup.Seed(cfg); err != nil {
			_ = json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}

		go func() {
			setup.StartService(cfg)
		}()

		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"url":     fmt.Sprintf("http://localhost:%d", cfg.Port),
		})
	})

	mux.HandleFunc("/api/status", func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "ready"})
	})

	port := 7788
	addr := fmt.Sprintf("localhost:%d", port)
	url := fmt.Sprintf("http://%s", addr)

	fmt.Printf("\n  Opening setup wizard at %s\n", url)
	openBrowser(url)

	return http.ListenAndServe(addr, mux)
}

func openBrowser(url string) {
	var cmd string
	var args []string
	switch runtime.GOOS {
	case "windows":
		cmd, args = "cmd", []string{"/c", "start", url}
	case "darwin":
		cmd, args = "open", []string{url}
	default:
		cmd, args = "xdg-open", []string{url}
	}
	_ = exec.Command(cmd, args...).Start()
}

