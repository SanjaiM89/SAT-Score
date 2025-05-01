package com.satresults.model;

import org.bson.Document;

public class SATMarks {
    private String studentId;
    private String subjectId;
    private double marks;
    private boolean isSubmitted;

    public SATMarks(String studentId, String subjectId, double marks, boolean isSubmitted) {
        this.studentId = studentId;
        this.subjectId = subjectId;
        this.marks = marks;
        this.isSubmitted = isSubmitted;
    }

    public Document toDocument() {
        return new Document("studentId", studentId)
                .append("subjectId", subjectId)
                .append("marks", marks)
                .append("isSubmitted", isSubmitted);
    }

    public static SATMarks fromDocument(Document doc) {
        return new SATMarks(
                doc.getString("studentId"),
                doc.getString("subjectId"),
                doc.getDouble("marks"),
                doc.getBoolean("isSubmitted")
        );
    }

    // Getters
    public String getStudentId() { return studentId; }
    public String getSubjectId() { return subjectId; }
    public double getMarks() { return marks; }
    public boolean isSubmitted() { return isSubmitted; }
}