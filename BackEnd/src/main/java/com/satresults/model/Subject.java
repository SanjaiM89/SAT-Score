package com.satresults.model;

import org.bson.Document;

public class Subject {
    private String id;
    private String name;
    private String code;
    private String type;
    private String departmentId;
    private int semester;
    private int credits;

    public Subject(String id, String name, String code, String type, String departmentId, int semester, int credits) {
        this.id = id;
        this.name = name;
        this.code = code;
        this.type = type;
        this.departmentId = departmentId;
        this.semester = semester;
        this.credits = credits;
    }

    public Document toDocument() {
        return new Document("id", id)
                .append("name", name)
                .append("code", code)
                .append("type", type)
                .append("departmentId", departmentId)
                .append("semester", semester)
                .append("credits", credits);
    }

    public static Subject fromDocument(Document doc) {
        return new Subject(
                doc.getString("id"),
                doc.getString("name"),
                doc.getString("code"),
                doc.getString("type"),
                doc.getString("departmentId"),
                doc.getInteger("semester"),
                doc.getInteger("credits")
        );
    }

    // Getters
    public String getId() { return id; }
    public String getName() { return name; }
    public String getCode() { return code; }
    public String getType() { return type; }
    public String getDepartmentId() { return departmentId; }
    public int getSemester() { return semester; }
    public int getCredits() { return credits; }
}