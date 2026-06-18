package config

import (
	"fmt"
	"net/url"
	"strconv"
	"strings"
)

type PgConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	DBName   string
}

type InstallConfig struct {
	LicenseKey  string
	Features    []string
	InstallPath string
	PgConfig    *PgConfig
	Port        int
	ServerHost  string
	JWTSecret   string
	CompanyName string
	AdminEmail  string
	AdminPass   string
}

func (c *InstallConfig) DatabaseURL() string {
	return fmt.Sprintf("postgresql://%s:%s@%s:%d/%s",
		c.PgConfig.User, c.PgConfig.Password,
		c.PgConfig.Host, c.PgConfig.Port, c.PgConfig.DBName)
}

// ExtractPortFromDatabaseURL returns the port from a postgresql:// URL (default 5432).
func ExtractPortFromDatabaseURL(dbURL string) int {
	u, err := url.Parse(dbURL)
	if err != nil {
		return 5432
	}
	if p := u.Port(); p != "" {
		if port, err := strconv.Atoi(p); err == nil {
			return port
		}
	}
	return 5432
}

// ParseDatabaseURL splits a PostgreSQL connection URL into connection parts.
func ParseDatabaseURL(dbURL string) (host, port, user, password, dbname string, err error) {
	u, err := url.Parse(dbURL)
	if err != nil {
		return "", "", "", "", "", err
	}

	host = u.Hostname()
	if host == "" {
		host = "localhost"
	}

	port = u.Port()
	if port == "" {
		port = "5432"
	}

	if u.User != nil {
		user = u.User.Username()
		password, _ = u.User.Password()
	}

	dbname = strings.TrimPrefix(u.Path, "/")
	if dbname == "" {
		return "", "", "", "", "", fmt.Errorf("database name missing in DATABASE_URL")
	}

	return host, port, user, password, dbname, nil
}
