package com.satresults;

import com.satresults.handler.*;
import com.satresults.util.EnvUtil;
import com.satresults.util.MongoDBConnection;
import com.satresults.util.ResponseUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import org.json.JSONObject;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.concurrent.Executors;

public class Main {
    public static void main(String[] args) throws IOException {
        // Initialize MongoDB connection
        MongoDBConnection.getDatabase();

        // Create HTTP server on port 8080
        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);
        server.setExecutor(Executors.newFixedThreadPool(10));

        // Define API routes
        server.createContext("/api/students", new StudentHandler());
        server.createContext("/api/teachers", new TeacherHandler());
        server.createContext("/api/departments", new DepartmentHandler());
        server.createContext("/api/subjects", new SubjectHandler());
        server.createContext("/api/assignments", new AssignmentHandler());
        server.createContext("/api/marks", new MarksHandler());
        server.createContext("/api/announcements", new AnnouncementHandler());
        server.createContext("/api/analytics", new AnalyticsHandler());
        server.createContext("/api/auth", new AuthHandler());
        server.createContext("/api/queries", new QueryHandler());
        server.createContext("/api/assessments", new AssessmentHandler());
        server.createContext("/api/tasks", new TaskHandler());

        // Handle CORS preflight requests globally
        server.createContext("/", new HttpHandler() {
            @Override
            public void handle(HttpExchange exchange) throws IOException {
                if ("OPTIONS".equals(exchange.getRequestMethod())) {
                    ResponseUtil.sendResponse(exchange, 200, new JSONObject());
                } else {
                    ResponseUtil.sendError(exchange, 404, "Not found");
                }
            }
        });

        // Start the server
        server.start();
        System.out.println("Server started on port 8080");
    }
}