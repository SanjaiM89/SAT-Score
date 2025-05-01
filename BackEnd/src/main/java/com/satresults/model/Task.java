package com.satresults.model;

import org.bson.Document;

public class Task {
    private String id;
    private String teacherId;
    private String name;
    private String subjectId;
    private String dueDate;

    public Task(String id, String teacherId, String name, String subjectId, String dueDate) {
        this.id = id;
        this.teacherId = teacherId;
        this.name = name;
        this.subjectId = subjectId;
        this.dueDate = dueDate;
    }

    public Document toDocument() {
        return new Document("id", id)
                .append("teacherId", teacherId)
                .append("name", name)
                .append("subjectId", subjectId)
                .append("dueDate", dueDate);
    }

    public static Task fromDocument(Document doc) {
        return new Task(
                doc.getString("id"),
                doc.getString("teacherId"),
                doc.getString("name"),
                doc.getString("subjectId"),
                doc.getString("dueDate")
        );
    }

    // Getters
    public String getId() { return id; }
    public String getTeacherId() { return teacherId; }
    public String getName() { return name; }
    public String getSubjectId() { return subjectId; }
    public String getDueDate() { return dueDate; }
}