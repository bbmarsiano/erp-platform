package config

import "testing"

func TestExtractPortFromDatabaseURL(t *testing.T) {
	tests := []struct {
		url  string
		want int
	}{
		{"postgresql://dflow:pass@localhost:5432/dflow_erp", 5432},
		{"postgresql://dflow:pass@localhost:5433/dflow_erp", 5433},
		{"postgresql://dflow:pass@localhost:5434/dflow_erp", 5434},
		{"postgresql://dflow:pass@localhost/dflow_erp", 5432},
	}

	for _, tt := range tests {
		if got := ExtractPortFromDatabaseURL(tt.url); got != tt.want {
			t.Errorf("ExtractPortFromDatabaseURL(%q) = %d, want %d", tt.url, got, tt.want)
		}
	}
}

func TestParseDatabaseURL(t *testing.T) {
	host, port, user, password, dbname, err := ParseDatabaseURL("postgresql://dflow:secret@localhost:5433/dflow_erp")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if host != "localhost" || port != "5433" || user != "dflow" || password != "secret" || dbname != "dflow_erp" {
		t.Fatalf("unexpected parse result: %s %s %s %s %s", host, port, user, password, dbname)
	}
}
