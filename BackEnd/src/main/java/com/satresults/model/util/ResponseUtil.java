package com.satresults.util;

import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpExchange;
import org.json.JSONObject;

import java.io.IOException;
import java.io.OutputStream;

public class ResponseUtil {
    public static void sendResponse(HttpExchange exchange, int statusCode, JSONObject response) throws IOException {
        String responseString = response.toString();
        Headers headers = exchange.getResponseHeaders();
        headers.add("Content-Type", "application/json");
        headers.add("Access-Control-Allow-Origin", EnvUtil.getOrDefault("FRONTEND_URL", "http://localhost:3000"));
        headers.add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization");
        exchange.sendResponseHeaders(statusCode, responseString.length());
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(responseString.getBytes());
        }
    }

    public static void sendError(HttpExchange exchange, int statusCode, String message) throws IOException {
        JSONObject error = new JSONObject();
        error.put("error", message);
        sendResponse(exchange, statusCode, error);
    }
}