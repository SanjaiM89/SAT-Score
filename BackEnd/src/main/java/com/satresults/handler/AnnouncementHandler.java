package com.satresults.handler;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Updates;
import com.satresults.model.Announcement;
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

public class AnnouncementHandler implements HttpHandler {
    private final MongoCollection<Document> collection =
            MongoDBConnection.getDatabase().getCollection("announcements");

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
        List<Document> announcements = collection.find().into(new ArrayList<>());
        JSONArray response = new JSONArray();
        for (Document doc : announcements) {
            response.put(new JSONObject(doc.toJson()));
        }
        ResponseUtil.sendResponse(exchange, 200, new JSONObject().put("announcements", response));
    }

    private void handlePost(HttpExchange exchange) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(exchange.getRequestBody()));
        StringBuilder requestBody = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            requestBody.append(line);
        }
        JSONObject json = new JSONObject(requestBody.toString());

        String id = IDGenerator.generateGenericId("announcements");
        Announcement announcement = new Announcement(
                id,
                json.getString("title"),
                json.getString("content"),
                json.getString("date"),
                json.getString("type"),
                json.getString("createdBy")
        );
        collection.insertOne(announcement.toDocument());
        ResponseUtil.sendResponse(exchange, 201, new JSONObject(announcement.toDocument().toJson()));
    }

    private void handlePut(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();
        String id = path.substring(path.lastIndexOf('/') + 1);

        BufferedReader reader = new BufferedReader(new InputStreamReader(exchange.getRequestBody()));
        StringBuilder