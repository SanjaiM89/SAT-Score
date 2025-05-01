package com.satresults.model;

import org.bson.Document;

public class Department {
    private String id;
    private String name;
    private String code;

    public Department(String id, String name, String code) {
        this.id = id;
        this.name = name;
        this.code = code;
    }

    public Document toDocument() {
        return new Document("id", id)
                .append("name", name)
                .append("code", code);
    }

    public static Department fromDocument(Document doc) {
        return new Department(
                doc.getString("id"),
                doc.getString("name"),
                doc.getString("code")
        );
    }

    // Getters
    public String getId() { return id; }
    public String getName() { return name; }
    public String getCode() { return code; }
}