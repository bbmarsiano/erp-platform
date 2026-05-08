package license

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

type ValidateResponse struct {
	Valid     bool     `json:"valid"`
	Features  []string `json:"features"`
	ExpiresAt string   `json:"expiresAt"`
	Tenant    string   `json:"tenant"`
}

type cacheFile struct {
	Key          string     `json:"key"`
	Features     []string   `json:"features"`
	LastVerified time.Time  `json:"lastVerified"`
	Raw          ValidateResponse `json:"raw"`
}

func Validate(serverURL, key string) ([]string, error) {
	client := &http.Client{Timeout: 15 * time.Second}

	body, _ := json.Marshal(map[string]string{"key": key})
	req, _ := http.NewRequest("POST", serverURL+"/functions/v1/validate-license", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2aHJheW5tdnl2YW5jcXllemVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTY4MDMsImV4cCI6MjA5MzYzMjgwM30.ubBo7w9sVcbq2oXDrJebWMP8Y2NOSd-aCAVdcRQsLC0")
	resp, err := client.Do(req)
	if err != nil {
		return checkLocalCache(key)
	}
	defer resp.Body.Close()

	var result ValidateResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("invalid response from license server")
	}
	if !result.Valid {
		return nil, fmt.Errorf("license key is invalid or expired")
	}

	saveLocalCache(key, result)
	return result.Features, nil
}

func checkLocalCache(key string) ([]string, error) {
	p := cachePath()
	b, err := os.ReadFile(p)
	if err != nil {
		return nil, fmt.Errorf("license server unreachable and no local cache found")
	}
	var c cacheFile
	if err := json.Unmarshal(b, &c); err != nil {
		return nil, fmt.Errorf("license server unreachable and local cache is invalid")
	}
	if c.Key != key {
		return nil, fmt.Errorf("license server unreachable and cached key does not match")
	}
	if time.Since(c.LastVerified) > 30*24*time.Hour {
		return nil, fmt.Errorf("license server unreachable and cache expired")
	}
	return c.Features, nil
}

func saveLocalCache(key string, result ValidateResponse) {
	p := cachePath()
	_ = os.MkdirAll(filepath.Dir(p), 0o700)
	payload := cacheFile{
		Key:          key,
		Features:     result.Features,
		LastVerified: time.Now(),
		Raw:          result,
	}
	b, _ := json.MarshalIndent(payload, "", "  ")
	_ = os.WriteFile(p, b, 0o600)
}

func cachePath() string {
	home, err := os.UserHomeDir()
	if err != nil {
		return ".dflow/license_cache.json"
	}
	return filepath.Join(home, ".dflow", "license_cache.json")
}

