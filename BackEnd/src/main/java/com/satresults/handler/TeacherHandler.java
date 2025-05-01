package com.satresults.handler;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Updates;
import com.satresults.model.Teacher;
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

public class TeacherHandler implements HttpHandler {
    private final MongoCollection<Document> collection =
            MongoDBConnection.getDatabase().getCollection("teachers");

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
        } else if (pathParts.length >= 4 && "subjects".equals(pathParts[pathParts.length - 1])) {
            handleSubjects(exchange, pathParts[pathParts.length - 2]);
        } else if (pathParts.length >= 4 && "students".equals(pathParts[pathParts.length - 1])) {
            handleStudents(exchange, pathParts[pathParts.length - 2]);
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
        List<Document> teachers = collection.find().into(new ArrayList<>());
        JSONArray response = new JSONArray();
        for (Document doc : teachers) {
            response.put(new JSONObject(doc.toJson()));
        }
        ResponseUtil.sendResponse(exchange, 200, new JSONObject().put("teachers", response));
    }

    private void handlePost(HttpExchange exchange) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(exchange.getRequestBody()));
        StringBuilder requestBody = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            requestBody.append(line);
        }
        JSONObject json = new JSONObject(requestBody.toString());

        String id = IDGenerator.generateTeacherId();
        Teacher teacher = new Teacher(
                id,
                json.getString("name"),
                json.getString("email"),
                json.getString("departmentId"),
                json.getJSONArray("subjects").toList().stream().map(Object::toString).toList()
        );
        collection.insertOne(teacher.toDocument());
        ResponseUtil.sendResponse(exchange, 201, new JSONObject(teacher.toDocument().toJson()));
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
        if (json.has("subjects")) update.append("subjects", json.getJSONArray("subjects").toList());

        collection.updateOne(Filters.eq("id", id), Updates.setMultiple(update));
        ResponseUtil.sendResponse(exchange, 200, new JSONObject().put("message", "Teacher updated"));
    }

    private void handleDelete(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();
        String id = path.substring(path.lastIndexOf('/') + 1);
        collection.deleteOne(Filters.eq("id", id));
        ResponseUtil.sendResponse(exchange, 200, new JSONObject().put("message", "Teacher deleted"));
    }

    private void handleDashboard(HttpExchange exchange, String teacherId) throws IOException {
        Document teacher = collection.find(Filters.eq("id", teacherId)).first();
        if (teacher == null) {
            ResponseUtil.sendError(exchange, 404, "Teacher not found");
            return;
        }

        MongoCollection<Document> assignmentsColl = MongoDBConnection.getDatabase().getCollection("assignments");
        List<Document> assignments = assignmentsColl.find(Filters.eq("teacherId", teacherId)).into(new ArrayList<>());
        MongoCollection<Document> tasksColl = MongoDBConnection.getDatabase().getCollection("tasks");
        List<Document> tasks = tasksColl.find(Filters.eq("teacherId", teacherId)).into(new ArrayList<>());

        JSONObject response = new JSONObject(teacher.toJson());
        response.put("assignments", new JSONArray(assignments.stream().map(Document::toJson).toList()));
        response.put("tasks", new JSONArray(tasks.stream().map(Document::toJson).toList()));
        ResponseUtil.sendResponse(exchange, 200, response);
    }

    private void handleSubjects(HttpExchange exchange, String teacherId) throws IOException {
        Document teacher = collection.find(Filters.eq("id", teacherId)).first();
        if (teacher == null) {
            ResponseUtil.sendError(exchange, 404, "Teacher not found");
            return;
        }

        MongoCollection<Document> subjectsColl = MongoDBConnection.getDatabase().getCollection("subjects");
        List<Document> subjects = subjectsColl.find(Filters.in("id", teacher.getList("subjects", String.class)))
                .into(new ArrayList<>());
        ResponseUtil.sendResponse(exchange, 200, new JSONObject().put("subjects", new JSONArray(subjects.stream().map(Document::toJson).toList())));
    }

    private void handleStudents(HttpExchange exchange, String teacherId) throws IOException {
        String query = exchange.getRequestURI().getQuery();
        String subjectId = query != null && query.contains("subjectId=") ?
                query.split("subjectId=")[1].split("&")[0] : null;
        String department = query != null && query.contains("department=") ?
                query.split("department=")[1].split("&")[0] : null;
        String year = query != null && query.contains("year=") ?
                query.split("year=")[1].split("&")[0] : null;

        MongoCollection<Document> studentsColl = MongoDBConnection.getDatabase().getCollection("students");
        var filter = Filters.empty();
        if (subjectId != null) {
            MongoCollection<Document> assignmentsColl = MongoDBConnection.getDatabase().getCollection("assignments");
            Document assignment = assignmentsColl.find(Filters.and(
                    Filters.eq("teacherId", teacherId),
                    Filters.eq("subjectId", subjectId)
            )).first();
            if (assignment != null) {
                filter = Filters.and(filter, Filters.eq("departmentId", assignment.getString("departmentId")));
                filter = Filters.and(filter, Filters.eq("semester", assignment.getInteger("semester")));
            }
        }
        if (department != null) filter = Filters.and(filter, Filters.eq("departmentId", department));
        if (year != null) filter = Filters.and(filter, Filters.eq("semester", Integer.parseInt(year) * 2));

        List<Document> students = studentsColl.find(filter).into(new ArrayList<>());
        ResponseUtil.sendResponse(exchange, 200, new JSONObject().put("students", new JSONArray(students.stream().map(Document::toJson).toList())));
    }
}