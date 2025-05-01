package com.satresults.model;

import org.bson.Document;

public class Result {
    private String studentId;
    private String subjectId;
    private int semester;
    private double internal;
    private double external;
    private double total;
    private String grade;
    private int gradePoint;
    private String category;

    public Result(String studentId, String subjectId, int semester, double internal, double external,
                  double total, String grade, int gradePoint, String category) {
        this.studentId = studentId;
        this.subjectId = subjectId;
        this.semester = semester;
        this.internal = internal;
        this.external = external;
        this.total = total;
        this.grade = grade;
        this.gradePoint = gradePoint;
        this.category = category;
    }

    public Document toDocument() {
        return new Document("studentId", studentId)
                .append("subjectId", subjectId)
                .append("semester", semester)
                .append("internal", internal)
                .append("external", external)
                .append("total", total)
                .append("grade", grade)
                .append("gradePoint", gradePoint)
                .append("category", category);
    }

    public static Result fromDocument(Document doc) {
        return new Result(
                doc.getString("studentId"),
                doc.getString("subjectId"),
                doc.getInteger("semester"),
                doc.getDouble("internal"),
                doc.getDouble("external"),
                doc.getDouble("total"),
                doc.getString("grade"),
                doc.getInteger("gradePoint"),
                doc.getString("category")
        );
    }

    // Getters
    public String getStudentId() { return studentId; }
    public String getSubjectId() { return subjectId; }
    public int getSemester() { return semester; }
    public double getInternal() { return internal; }
    public double getExternal() { return external; }
    public double getTotal() { return total; }
    public String getGrade() { return grade; }
    public int getGradePoint() { return gradePoint; }
    public String getCategory() { return category; }
}