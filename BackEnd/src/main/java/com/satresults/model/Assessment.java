package com.satresults.model;

import org.bson.Document;

public class Assessment {
    private String id;
    private String name;
    private String subjectId;
    private String dueDate;

    public Assessment(String id, String name, String subjectId, String dueDate) {
        this.id = id;
        this.name = name;
        this.subjectId = subjectId;
        this.dueDate = dueDate;
    }

    public Document toDocument() {
        return new Document("id", id)
                .append("name", name)
                .append("subjectId", subjectId)
                .append("dueDate", dueDate);
    }

    public static Assessment fromDocument(Document doc) {
        return new Assessment(
                doc.getString("id"),
                doc.getString("name"),
                doc.getString("subjectId"),
                doc.getString("dueDate")
        );
    }

    // Getters
    public String getId() { return id; }
    public String getName() { return name; }
    public String getSubjectId() { return subjectId; }
    public String getDueDate() { return dueDate; }
}