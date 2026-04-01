package com.mentora.platform.config;

import java.net.URI;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

public class DatabaseUrlEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    private static final String PROPERTY_SOURCE_NAME = "mentoraNormalizedDatasource";
    private static final String NORMALIZED_URL_KEY = "APP_DATASOURCE_URL";
    private static final String NORMALIZED_USERNAME_KEY = "APP_DATASOURCE_USERNAME";
    private static final String NORMALIZED_PASSWORD_KEY = "APP_DATASOURCE_PASSWORD";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String rawUrl = firstNonBlank(
                environment.getProperty("SPRING_DATASOURCE_URL"),
                environment.getProperty("DATABASE_URL")
        );

        if (rawUrl == null) {
            return;
        }

        DatabaseSettings normalized = normalize(
                rawUrl,
                environment.getProperty("SPRING_DATASOURCE_USERNAME"),
                environment.getProperty("SPRING_DATASOURCE_PASSWORD")
        );

        Map<String, Object> properties = new LinkedHashMap<>();
        properties.put(NORMALIZED_URL_KEY, normalized.url());

        if (isPresent(normalized.username())) {
            properties.put(NORMALIZED_USERNAME_KEY, normalized.username());
        }

        if (isPresent(normalized.password())) {
            properties.put(NORMALIZED_PASSWORD_KEY, normalized.password());
        }

        environment.getPropertySources().addFirst(new MapPropertySource(PROPERTY_SOURCE_NAME, properties));
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }

    static DatabaseSettings normalize(String rawUrl, String explicitUsername, String explicitPassword) {
        if (!isPresent(rawUrl)) {
            return new DatabaseSettings(rawUrl, explicitUsername, explicitPassword);
        }

        if (rawUrl.startsWith("jdbc:")) {
            return new DatabaseSettings(rawUrl, explicitUsername, explicitPassword);
        }

        if (!(rawUrl.startsWith("postgres://") || rawUrl.startsWith("postgresql://"))) {
            return new DatabaseSettings(rawUrl, explicitUsername, explicitPassword);
        }

        URI uri = URI.create(rawUrl);
        String database = uri.getPath() != null ? uri.getPath().replaceFirst("^/", "") : "";
        String host = uri.getHost();

        if (!isPresent(host) || !isPresent(database)) {
            return new DatabaseSettings(rawUrl, explicitUsername, explicitPassword);
        }

        Map<String, String> queryParams = parseQuery(uri.getRawQuery());
        Credentials urlCredentials = credentialsFromUri(uri);

        String username = firstNonBlank(explicitUsername, queryParams.remove("user"), urlCredentials.username());
        String password = firstNonBlank(explicitPassword, queryParams.remove("password"), urlCredentials.password());

        StringBuilder jdbcUrl = new StringBuilder("jdbc:postgresql://").append(host);
        if (uri.getPort() > 0) {
            jdbcUrl.append(':').append(uri.getPort());
        }
        jdbcUrl.append('/').append(database);

        if (!queryParams.isEmpty()) {
            String encodedQuery = queryParams.entrySet().stream()
                    .map(entry -> encode(entry.getKey()) + "=" + encode(entry.getValue()))
                    .collect(Collectors.joining("&"));
            jdbcUrl.append('?').append(encodedQuery);
        }

        return new DatabaseSettings(jdbcUrl.toString(), username, password);
    }

    private static Map<String, String> parseQuery(String rawQuery) {
        Map<String, String> params = new LinkedHashMap<>();
        if (!isPresent(rawQuery)) {
            return params;
        }

        Arrays.stream(rawQuery.split("&"))
                .filter(DatabaseUrlEnvironmentPostProcessor::isPresent)
                .forEach(pair -> {
                    String[] segments = pair.split("=", 2);
                    String key = decode(segments[0]);
                    String value = segments.length > 1 ? decode(segments[1]) : "";
                    params.put(key, value);
                });

        return params;
    }

    private static Credentials credentialsFromUri(URI uri) {
        if (!isPresent(uri.getRawUserInfo())) {
            return new Credentials(null, null);
        }

        String[] parts = uri.getRawUserInfo().split(":", 2);
        String username = parts.length > 0 ? decode(parts[0]) : null;
        String password = parts.length > 1 ? decode(parts[1]) : null;
        return new Credentials(username, password);
    }

    private static String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private static String firstNonBlank(String... values) {
        return Arrays.stream(values)
                .filter(DatabaseUrlEnvironmentPostProcessor::isPresent)
                .findFirst()
                .orElse(null);
    }

    private static boolean isPresent(String value) {
        return value != null && !value.isBlank();
    }

    record DatabaseSettings(String url, String username, String password) {
    }

    private record Credentials(String username, String password) {
    }
}
