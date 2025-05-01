package com.satresults.model;

import org.bson.Document;

public class Query {
    private String id;
    private String studentId;
    private String subjectCode;
    private String subjectName;
    private String message;
    private String createdAt;

    public Query(String id, String studentId, String subjectCode, String subjectName, String message, String createdAt) {
        this.id = id;
        this.studentId = studentId;
        this.subjectCode = subjectCode;
        this.subjectName = subjectName;
        this.message = message;
        this.createdAt = createdAt;
    }

    public Document toDocument() {
        return new Document("id", id)
                .append("studentId", studentId)
                .append("subjectCode", subjectCode)
                .append("subjectName", subjectName)
                .append("message", message)
                .append("createdAt", createdAt);
    }

    public static Query fromDocument(Document doc) {
        return new Query(
                doc.getString("id"),
                doc.getString("studentId"),
                doc.getString("subjectCode"),
                doc.getString("subjectName"),
                doc.getString("message"),
                doc.getString("createdAt")
        );
    }

    // Getters
    public String getId() { return id; }
    public String getStudentId() { return studentId; }
    public String getSubjectCode() { return subjectCode; }
    public String getSubjectName() { return subjectName; }
    public String getMessage() { return message; }
    public String getCreatedAt() { return createdAt; }
}