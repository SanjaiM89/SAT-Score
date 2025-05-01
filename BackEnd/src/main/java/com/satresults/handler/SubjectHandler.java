package com.satresults.handler;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Updates;
import com.satresults.model.Subject;
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

public class SubjectHandler implements HttpHandler {
    private final MongoCollection<Document> collection =
            MongoDBConnection.getDatabase().getCollection("subjects");

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
        List<Document> subjects = collection.find().into(new ArrayList<>());
        JSONArray response = new JSONArray();
        for (Document doc : subjects) {
            response.put(new JSONObject(doc.toJson()));
        }
        ResponseUtil.sendResponse(exchange, 200, new JSONObject().put("subjects", response));
    }

    private void handlePost(HttpExchange exchange) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(exchange.getRequestBody()));
        StringBuilder requestBody = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            requestBody.append(line);
        }
        JSONObject json = new JSONObject(requestBody.toString());

        String id = IDGenerator.generateGenericId("subjects");
        Subject subject = new Subject(
                id,
                json.getString("name"),
                json.getString("code"),
                json.getString("type"),
                json.getString("departmentId"),
                json.getInt("semester"),
                json.getInt("credits")
        );
        collection.insertOne(subject.toDocument());
        ResponseUtil.sendResponse(exchange, 201, new JSONObject(subject.toDocument().toJson()));
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
        if (json.has("name")) update.append("name", json.getString("name"));
        if (json.has("code")) update.append("code", json.getString("code"));
        if (json.has("type")) update.append("type", json.getString("type"));
        if (json.has("departmentId")) update.append("departmentId", json.getString("departmentId"));
        if (json.has("semester")) update.append("semester", json.getInt("semester"));
        if (json.has("credits")) update.append("credits", json.getInt("credits"));

        collection.updateOne(Filters.eq("id", id), Updates.setMultiple(update));
        ResponseUtil.sendResponse(exchange, 200, new JSONObject().put("message", "Subject updated"));
    }

    private void handleDelete(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();
        String id = path.substring(path.lastIndexOf('/') + 1);
        collection.deleteOne(Filters.eq("id", id));
        ResponseUtil.sendResponse(exchange, 200, new JSONObject().put("message", "Subject deleted"));
    }
}