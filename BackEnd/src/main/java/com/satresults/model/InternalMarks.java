package com.satresults.model;

import org.bson.Document;

import java.util.List;

public class InternalMarks {
    private String studentId;
    private String subjectId;
    private int fatNumber;
    private double fatMarks;
    private List<Double> assignments;

    public InternalMarks(String studentId, String subjectId, int fatNumber, double fatMarks, List<Double> assignments) {
        this.studentId = studentId;
        this.subjectId = subjectId;
        this.fatNumber = fatNumber;
        this.fatMarks = fatMarks;
        this.assignments = assignments;
    }

    public Document toDocument() {
        return new Document("studentId", studentId)
                .append("subjectId", subjectId)
                .append("fatNumber", fatNumber)
                .append("fatMarks", fatMarks)
                .append("assignments", assignments);
    }

    public static InternalMarks fromDocument(Document doc) {
        return new InternalMarks(
                doc.getString("studentId"),
                doc.getString("subjectId"),
                doc.getInteger("fatNumber"),
                doc.getDouble("fatMarks"),
                doc.getList("assignments", Double.class)
        );
    }

    // Getters
    public String getStudentId() { return studentId; }
    public String getSubjectId() { return subjectId; }
    public int getFatNumber() { return fatNumber; }
    public double getFatMarks() { return fatMarks; }
    public List<Double> getAssignments() { return assignments; }
}