package com.satresults.handler;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Updates;
import com.satresults.model.Assignment;
import com.satresults.util.IDGenerator;
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

public class AssignmentHandler implements HttpHandler {
    private final MongoCollection<Document> collection =
            MongoDBConnection.getDatabase().getCollection("assignments");

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();

        if ("OPTIONS".equals(method)) {
            ResponseUtil.sendResponse(exchange, 200, new JSONObject());
            return;
        }

        switch (method) {
            case "GET":
                handleGet(exchange);
                break;
            case "POST":
                handlePost(exchange);
                break;
            case "PUT":
                handlePut(exchange);
                break;
            case "DELETE":
                handleDelete(exchange);
                break;
            default:
                ResponseUtil.sendError(exchange, 405, "Method not allowed");
        }
    }

    private void handleGet(HttpExchange exchange) throws IOException {
        List<Document> assignments = collection.find().into(new ArrayList<>());
        JSONArray response = new JSONArray();
        for (Document doc : assignments) {
            response.put(new JSONObject(doc.toJson()));
        }
        ResponseUtil.sendResponse(exchange, 200, new JSONObject().put("assignments", response));
    }

    private void handlePost(HttpExchange exchange) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(exchange.getRequestBody()));
        StringBuilder requestBody = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            requestBody.append(line);
        }
        JSONObject json = new JSONObject(requestBody.toString());

        JSONArray scheduleJson = json.getJSONArray("schedule");
        List<Assignment.Schedule> schedule = scheduleJson.toList().stream().map(obj -> {
            JSONObject sch = new JSONObject(obj.toString());
            return new Assignment.Schedule(
                    sch.getString("day"),
                    sch.getString("time"),
                    sch.getString("room")
            );
        }).collect(Collectors.toList());

        String id = IDGenerator.generateGenericId("assignments");
        Assignment assignment = new Assignment(
                id,
                json.getString("teacherId"),
                json.getString("subjectId"),
                json.getString("departmentId"),
                json.getInt("semester"),
                json.getString("batch"),
                json.getString("section"),
                schedule
        );
        collection.insertOne(assignment.toDocument());
        ResponseUtil.sendResponse(exchange, 201, new JSONObject(assignment.toDocument().toJson()));
    }

    private void handlePut(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();
        String id = path.substring(path.lastIndexOf('/') + 1);

        BufferedReader reader = new BufferedReader(new InputStreamReader(exchange.getRequestBody()));
        StringBuilder requestBody = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            requestBody.append(line);
        }
        JSONObject json = new JSONObject(requestBody.toString());

        Document update = new Document();
        if (json.has("teacherId")) update.append("teacherId", json.getString("teacherId"));
        if (json.has("subjectId")) update.append("subjectId", json.getString("subjectId"));
        if (json.has("departmentId")) update.append("departmentId", json.getString("departmentId"));
        if (json.has("semester")) update.append("semester", json.getInt("semester"));
        if (json.has("batch")) update.append("batch", json.getString("batch"));
        if (json.has("section")) update.append("section", json.getString("section"));
        if (json.has("schedule")) {
            JSONArray scheduleJson = json.getJSONArray("schedule");
            List<Document> scheduleDocs = scheduleJson.toList().stream()
                    .map(obj -> new JSONObject(obj.toString()))
                    .map(sch -> new Document("day", sch.getString("day"))
                            .append("time", sch.getString("time"))
                            .append("room", sch.getString("room")))
                    .collect(Collectors.toList());
            update.append("schedule", scheduleDocs);
        }

        collection.updateOne(Filters.eq("id", id), Updates.setMultiple(update));
        ResponseUtil.sendResponse(exchange, 200, new JSONObject().put("message", "Assignment updated"));
    }

    private void handleDelete(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();
        String id = path.substring(path.lastIndexOf('/') + 1);
        collection.deleteOne(Filters.eq("id", id));
        ResponseUtil.sendResponse(exchange, 200, new JSONObject().put("message", "Assignment deleted"));
    }
}