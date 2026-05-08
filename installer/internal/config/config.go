package config

import "fmt"

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

