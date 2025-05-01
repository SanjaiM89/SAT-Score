package com.satresults.model;

import org.bson.Document;

import java.util.List;

public class Teacher {
    private String id;
    private String name;
    private String email;
    private String departmentId;
    private List<String> subjects;

    public Teacher(String id, String name, String email, String departmentId, List<String> subjects) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.departmentId = departmentId;
        this.subjects = subjects;
    }

    public Document toDocument() {
        return new Document("id", id)
                .append("name", name)
                .append("email", email)
                .append("departmentId", departmentId)
                .append("subjects", subjects);
    }

    public static Teacher fromDocument(Document doc) {
        return new Teacher(
                doc.getString("id"),
                doc.getString("name"),
                doc.getString("email"),
                doc.getString("departmentId"),
                doc.getList("subjects", String.class)
        );
    }

    // Getters
    public String getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getDepartmentId() { return departmentId; }
    public List<String> getSubjects() { return subjects; }
}