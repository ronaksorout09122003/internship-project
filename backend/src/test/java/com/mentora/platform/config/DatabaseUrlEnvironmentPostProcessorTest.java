package com.mentora.platform.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.Test;

class DatabaseUrlEnvironmentPostProcessorTest {

    @Test
    void keepsJdbcUrlsUntouched() {
        DatabaseUrlEnvironmentPostProcessor.DatabaseSettings settings =
                DatabaseUrlEnvironmentPostProcessor.normalize(
                        "jdbc:postgresql://localhost:5432/mentor_platform",
                        "postgres",
                        "secret"
                );

        assertEquals("jdbc:postgresql://localhost:5432/mentor_platform", settings.url());
        assertEquals("postgres", settings.username());
        assertEquals("secret", settings.password());
    }

    @Test
    void convertsStandardPostgresUrlsToJdbc() {
        DatabaseUrlEnvironmentPostProcessor.DatabaseSettings settings =
                DatabaseUrlEnvironmentPostProcessor.normalize(
                        "postgresql://demo-user:demo-pass@db.example.com:5432/neondb?sslmode=require&channelBinding=require",
                        null,
                        null
                );

        assertEquals(
                "jdbc:postgresql://db.example.com:5432/neondb?sslmode=require&channelBinding=require",
                settings.url()
        );
        assertEquals("demo-user", settings.username());
        assertEquals("demo-pass", settings.password());
    }

    @Test
    void extractsCredentialsFromQueryParamsWhenPresent() {
        DatabaseUrlEnvironmentPostProcessor.DatabaseSettings settings =
                DatabaseUrlEnvironmentPostProcessor.normalize(
                        "postgresql://db.example.com/neondb?user=neondb_owner&password=topsecret&sslmode=require",
                        null,
                        null
                );

        assertEquals("jdbc:postgresql://db.example.com/neondb?sslmode=require", settings.url());
        assertEquals("neondb_owner", settings.username());
        assertEquals("topsecret", settings.password());
    }

    @Test
    void explicitCredentialsWinOverUrlCredentials() {
        DatabaseUrlEnvironmentPostProcessor.DatabaseSettings settings =
                DatabaseUrlEnvironmentPostProcessor.normalize(
                        "postgresql://ignored-user:ignored-pass@db.example.com/neondb?sslmode=require",
                        "render-user",
                        "render-pass"
                );

        assertEquals("jdbc:postgresql://db.example.com/neondb?sslmode=require", settings.url());
        assertEquals("render-user", settings.username());
        assertEquals("render-pass", settings.password());
    }

    @Test
    void leavesUnsupportedUrlsAsIs() {
        DatabaseUrlEnvironmentPostProcessor.DatabaseSettings settings =
                DatabaseUrlEnvironmentPostProcessor.normalize("mysql://example.com/db", null, null);

        assertEquals("mysql://example.com/db", settings.url());
        assertNull(settings.username());
        assertNull(settings.password());
    }
}
