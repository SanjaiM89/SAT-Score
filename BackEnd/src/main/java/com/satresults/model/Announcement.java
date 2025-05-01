package com.satresults.model;

import org.bson.Document;

public class Announcement {
    private String id;
    private String title;
    private String content;
    private String date;
    private String type;
    private String createdBy;

    public Announcement(String id, String title, String content, String date, String type, String createdBy) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.date = date;
        this.type = type;
        this.createdBy = createdBy;
    }

    public Document toDocument() {
        return new Document("id", id)
                .append("title", title)
                .append("content", content)
                .append("date", date)
                .append("type", type)
                .append("createdBy", createdBy);
    }

    public static Announcement fromDocument(Document doc) {
        return new Announcement(
                doc.getString("id"),
                doc.getString("title"),
                doc.getString("content"),
                doc.getString("date"),
                doc.getString("type"),
                doc.getString("createdBy")
        );
    }

    // Getters
    public String getId() { return id; }
    public String getTitle() { return title; }
    public String getContent() { return content; }
    public String getDate() { return date; }
    public String getType() { return type; }
    public String getCreatedBy() { return createdBy; }
}