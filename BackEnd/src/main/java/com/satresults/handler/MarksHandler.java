package com.satresults.handler;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Updates;
import com.satresults.model.InternalMarks;
import com.satresults.model.SATMarks;
import com.satresults.util.MongoDBConnection;
import com.satresults.util.ResponseUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import org.bson.Document;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class MarksHandler implements HttpHandler {
    private final MongoCollection<Document> internalMarksColl =
            MongoDBConnection.getDatabase().getCollection("internal_marks");
    private final MongoCollection<Document> satMarksColl =
            MongoDBConnection.getDatabase().getCollection("sat_marks");

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();

        if ("OPTIONS".equals(method)) {
            ResponseUtil.sendResponse(exchange, 200, new JSONObject());
            return;
        }

        if (path.contains("/internal")) {
            handleInternalMarks(exchange);
        } else if (path.contains("/sat")) {
            handleSATMarks(exchange);
        } else {
            ResponseUtil.sendError(exchange, 404, "Endpoint not found");
        }
    }

    private void handleInternalMarks(HttpExchange exchange) throws IOException {
        if (!"POST".equals(exchange.getRequestMethod())) {
            ResponseUtil.sendError(exchange, 405, "Method not allowed");
            return;
        }

        BufferedReader reader = new BufferedReader(new InputStreamReader(exchange.getRequestBody()));
        StringBuilder requestBody = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            requestBody.append(line);
        }
        JSONObject json = new JSONObject(requestBody.toString());

        String studentId = json.getString("studentId");
        String subjectId = json.getString("subjectId");
        int fatNumber = json.getInt("fatNumber");
        double fatMarks = json.getDouble("fatMarks");
        List<Double> assignments = json.getJSONArray("assignments").toList().stream()
                .map(obj -> Double.valueOf(obj.toString())).collect(Collectors.toList());

        InternalMarks marks = new InternalMarks(studentId, subjectId, fatNumber, fatMarks, assignments);
        internalMarksColl.findOneAndReplace(
                Filters.and(Filters.eq("studentId", studentId), Filters.eq("subjectId", subjectId), Filters.eq("fatNumber", fatNumber)),
                marks.toDocument(),
                new com.mongodb.client.model.FindOneAndReplaceOptions().upsert(true)
        );
        ResponseUtil.sendResponse(exchange, 200, new JSONObject().put("message", "Internal marks saved"));
    }

    private void handleSATMarks(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod();

        if (path.endsWith("/submit")) {
            if (!"POST".equals(method)) {
                ResponseUtil.sendError(exchange, 405, "Method not allowed");
                return;
            }
            handleSATSubmit(exchange);
        } else if ("POST".equals(method)) {
            handleSATSave(exchange);
        } else {
            ResponseUtil.sendError(exchange, 405, "Method not allowed");
        }
    }

    private void handleSATSave(HttpExchange exchange) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(exchange.getRequestBody()));
        StringBuilder requestBody = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            requestBody.append(line);
        }
        JSONObject json = new JSONObject(requestBody.toString());

        String studentId = json.getString("studentId");
        String subjectId = json.getString("subjectId");
        double marks = json.getDouble("marks");

        Document existing = satMarksColl.find(Filters.and(Filters.eq("studentId", studentId), Filters.eq("subjectId", subjectId))).first();
        if (existing != null && existing.getBoolean("isSubmitted")) {
            ResponseUtil.sendError(exchange, 400, "Marks already submitted");
            return;
        }

        SATMarks satMarks = new SATMarks(studentId, subjectId, marks, false);
        satMarksColl.findOneAndReplace(
                Filters.and(Filters.eq("studentId", studentId), Filters.eq("subjectId", subjectId)),
                satMarks.toDocument(),
                new com.mongodb.client.model.FindOneAndReplaceOptions().upsert(true)
        );
        ResponseUtil.sendResponse(exchange, 200, new JSONObject().put("message", "SAT marks saved"));
    }

    private void handleSATSubmit(HttpExchange exchange) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(exchange.getRequestBody()));
        StringBuilder requestBody = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            requestBody.append(line);
        }
        JSONObject json = new JSONObject(requestBody.toString());

        String subjectId = json.getString("subjectId");
        satMarksColl.updateMany(
                Filters.and(Filters.eq("subjectId", subjectId), Filters.eq("isSubmitted", false)),
                Updates.set("isSubmitted", true)
        );
        ResponseUtil.sendResponse(exchange, 200, new JSONObject().put("message", "SAT marks submitted"));
    }
}