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

	mux.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.FS(staticFiles))))
	mux.HandleFunc("/", serveIndex)

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

func LaunchTestMode(cfg *config.InstallConfig) error {
	mux := http.NewServeMux()
	mux.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.FS(staticFiles))))
	mux.HandleFunc("/", serveIndex)
	mux.HandleFunc("/api/complete", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			return
		}
		var body struct {
			CompanyName string `json:"companyName"`
			AdminEmail  string `json:"adminEmail"`
			AdminPass   string `json:"adminPass"`
			Port        int    `json:"port"`
		}
		_ = json.NewDecoder(r.Body).Decode(&body)
		cfg.CompanyName = body.CompanyName
		cfg.AdminEmail = body.AdminEmail
		cfg.AdminPass = body.AdminPass
		if body.Port > 0 {
			cfg.Port = body.Port
		}
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"url":     fmt.Sprintf("http://localhost:%d", 3001),
		})
	})
	mux.HandleFunc("/api/status", func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "test-mode"})
	})

	port := 7788
	go openBrowser(fmt.Sprintf("http://localhost:%d", port))
	return http.ListenAndServe(fmt.Sprintf(":%d", port), mux)
}

func serveIndex(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}
	b, err := staticFiles.ReadFile("static/index.html")
	if err != nil {
		http.Error(w, "index not found", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_, _ = w.Write(b)
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

