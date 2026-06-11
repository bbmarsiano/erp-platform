package license

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2aHJheW5tdnl2YW5jcXllemVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTY4MDMsImV4cCI6MjA5MzYzMjgwM30.ubBo7w9sVcbq2oXDrJebWMP8Y2NOSd-aCAVdcRQsLC0"

type ValidateResponse struct {
	Valid     bool     `json:"valid"`
	Features  []string `json:"features"`
	ExpiresAt string   `json:"expiresAt"`
	Tenant    string   `json:"tenant"`
}

type CacheEntry struct {
	Key       string   `json:"key"`
	Features  []string `json:"features"`
	ExpiresAt string   `json:"expiresAt"`
	CachedAt  string   `json:"cachedAt"`
}

func Validate(serverURL, key string) ([]string, error) {
	transport := &http.Transport{
		TLSClientConfig: &tls.Config{
			MinVersion: tls.VersionTLS12,
		},
		ForceAttemptHTTP2: false,
	}
	client := &http.Client{
		Timeout:   20 * time.Second,
		Transport: transport,
	}

	body, _ := json.Marshal(map[string]string{"key": key})
	req, err := http.NewRequest("POST",
		serverURL+"/functions/v1/validate-license",
		bytes.NewBuffer(body))
	if err != nil {
		return checkLocalCache(key)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+ANON_KEY)
	req.Header.Set("User-Agent", "DFlowERP-Installer/0.1.0")

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

func ValidateWithVersion(serverURL, key string) ([]string, string, error) {
	transport := &http.Transport{
		TLSClientConfig: &tls.Config{
			MinVersion: tls.VersionTLS12,
		},
		ForceAttemptHTTP2: false,
	}
	client := &http.Client{
		Timeout:   20 * time.Second,
		Transport: transport,
	}

	body, _ := json.Marshal(map[string]string{"key": key})
	req, err := http.NewRequest("POST",
		serverURL+"/functions/v1/validate-license",
		bytes.NewBuffer(body))
	if err != nil {
		return nil, "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+ANON_KEY)
	req.Header.Set("User-Agent", "DFlowERP-Installer/0.2.0")

	resp, err := client.Do(req)
	if err != nil {
		return nil, "", fmt.Errorf("license server unreachable")
	}
	defer resp.Body.Close()

	var result struct {
		Valid          bool     `json:"valid"`
		Features       []string `json:"features"`
		AllowedVersion string   `json:"allowedVersion"`
		Error          string   `json:"error"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, "", fmt.Errorf("invalid response")
	}
	if !result.Valid {
		return nil, "", fmt.Errorf("%s", result.Error)
	}

	return result.Features, result.AllowedVersion, nil
}

func cacheFilePath() string {
	home, _ := os.UserHomeDir()
	dir := filepath.Join(home, ".dflow")
	_ = os.MkdirAll(dir, 0o700)
	return filepath.Join(dir, "license_cache.json")
}

func checkLocalCache(key string) ([]string, error) {
	data, err := os.ReadFile(cacheFilePath())
	if err != nil {
		return nil, fmt.Errorf("license server unreachable and no local cache found")
	}
	var cache CacheEntry
	if err := json.Unmarshal(data, &cache); err != nil {
		return nil, fmt.Errorf("license server unreachable and cache corrupted")
	}
	if cache.Key != key {
		return nil, fmt.Errorf("license server unreachable and cached key does not match")
	}
	cachedAt, err := time.Parse(time.RFC3339, cache.CachedAt)
	if err != nil || time.Since(cachedAt) > 30*24*time.Hour {
		return nil, fmt.Errorf("license server unreachable and cache expired (>30 days)")
	}
	return cache.Features, nil
}

func saveLocalCache(key string, result ValidateResponse) {
	cache := CacheEntry{
		Key:       key,
		Features:  result.Features,
		ExpiresAt: result.ExpiresAt,
		CachedAt:  time.Now().Format(time.RFC3339),
	}
	data, _ := json.Marshal(cache)
	_ = os.WriteFile(cacheFilePath(), data, 0o600)
}
