package com.satresults.handler;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Updates;
import com.satresults.model.Student;
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

public class StudentHandler implements HttpHandler {
    private final MongoCollection<Document> collection =
            MongoDBConnection.getDatabase().getCollection("students");

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();
        String[] pathParts = path.split("/");

        if ("OPTIONS".equals(method)) {
            ResponseUtil.sendResponse(exchange, 200, new JSONObject());
            return;
        }

        if (pathParts.length >= 4 && "dashboard".equals(pathParts[pathParts.length - 1])) {
            handleDashboard(exchange, pathParts[pathParts.length - 2]);
        } else if (pathParts.length >= 4 && "results".equals(pathParts[pathParts.length - 1])) {
            handleResults(exchange, pathParts[pathParts.length - 2]);
        } else {
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
    }

    private void handleGet(HttpExchange exchange) throws IOException {
        List<Document> students = collection.find().into(new ArrayList<>());
        JSONArray response = new JSONArray();
        for (Document doc : students) {
            response.put(new JSONObject(doc.toJson()));
        }
        ResponseUtil.sendResponse(exchange, 200, new JSONObject().put("students", response));
    }

    private void handlePost(HttpExchange exchange) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(exchange.getRequestBody()));
        StringBuilder requestBody = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            requestBody.append(line);
        }
        JSONObject json = new JSONObject(requestBody.toString());

        String departmentId = json.getString("departmentId");
        Document dept = MongoDBConnection.getDatabase().getCollection("departments")
                .find(Filters.eq("id", departmentId)).first();
        if (dept == null) {
            ResponseUtil.sendError(exchange, 400, "Invalid department ID");
            return;
        }

        String id = IDGenerator.generateStudentId(dept.getString("code"));
        Student student = new Student(
                id,
                json.getString("name"),
                json.getString("email"),
                departmentId,
                json.getInt("semester"),
                id
        );
        collection.insertOne(student.toDocument());
        ResponseUtil.sendResponse(exchange, 201, new JSONObject(student.toDocument().toJson()));
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
        if (json.has("email")) update.append("email", json.getString("email"));
        if (json.has("departmentId")) update.append("departmentId", json.getString("departmentId"));
        if (json.has("semester")) update.append("semester", json.getInt("semester"));

        collection.updateOne(Filters.eq("id", id), Updates.setMultiple(update));
        ResponseUtil.sendResponse(exchange, 200, new JSONObject().put("message", "Student updated"));
    }

    private void handleDelete(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();
        String id = path.substring(path.lastIndexOf('/') + 1);
        collection.deleteOne(Filters.eq("id", id));
        ResponseUtil.sendResponse(exchange, 200, new JSONObject().put("message", "Student deleted"));
    }

    private void handleDashboard(HttpExchange exchange, String studentId) throws IOException {
        Document student = collection.find(Filters.eq("id", studentId)).first();
        if (student == null) {
            ResponseUtil.sendError(exchange, 404, "Student not found");
            return;
        }

        MongoCollection<Document> resultsColl = MongoDBConnection.getDatabase().getCollection("results");
        List<Document> results = resultsColl.find(Filters.eq("studentId", studentId)).into(new ArrayList<>());
        MongoCollection<Document> assessmentsColl = MongoDBConnection.getDatabase().getCollection("assessments");
        List<Document> assessments = assessmentsColl.find().into(new ArrayList<>());

        JSONObject response = new JSONObject(student.toJson());
        response.put("results", new JSONArray(results.stream().map(Document::toJson).toList()));
        response.put("assessments", new JSONArray(assessments.stream().map(Document::toJson).toList()));
        ResponseUtil.sendResponse(exchange, 200, response);
    }

    private void handleResults(HttpExchange exchange, String studentId) throws IOException {
        String query = exchange.getRequestURI().getQuery();
        String semester = query != null && query.contains("semester=") ?
                query.split("semester=")[1].split("&")[0] : null;
        String category = query != null && query.contains("category=") ?
                query.split("category=")[1].split("&")[0] : null;

        MongoCollection<Document> resultsColl = MongoDBConnection.getDatabase().getCollection("results");
        var filter = Filters.eq("studentId", studentId);
        if (semester != null) filter = Filters.and(filter, Filters.eq("semester", Integer.parseInt(semester)));
        if (category != null) filter = Filters.and(filter, Filters.eq("category", category));

        List<Document> results = resultsColl.find(filter).into(new ArrayList<>());
        ResponseUtil.sendResponse(exchange, 200, new JSONObject().put("results", new JSONArray(results.stream().map(Document::toJson).toList())));
    }
}