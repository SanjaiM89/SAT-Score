package com.satresults.model;

import org.bson.Document;

public class Student {
    private String id;
    private String name;
    private String email;
    private String departmentId;
    private int semester;
    private String rollNumber;
    private double cgpa;
    private int totalCredits;

    public Student(String id, String name, String email, String departmentId, int semester, String rollNumber) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.departmentId = departmentId;
        this.semester = semester;
        this.rollNumber = rollNumber;
        this.cgpa = 0.0;
        this.totalCredits = 0;
    }

    public Document toDocument() {
        return new Document("id", id)
                .append("name", name)
                .append("email", email)
                .append("departmentId", departmentId)
                .append("semester", semester)
                .append("rollNumber", rollNumber)
                .append("cgpa", cgpa)
                .append("totalCredits", totalCredits);
    }

    public static Student fromDocument(Document doc) {
        Student student = new Student(
                doc.getString("id"),
                doc.getString("name"),
                doc.getString("email"),
                doc.getString("departmentId"),
                doc.getInteger("semester"),
                doc.getString("rollNumber")
        );
        student.cgpa = doc.getDouble("cgpa");
        student.totalCredits = doc.getInteger("totalCredits");
        return student;
    }

    // Getters and setters
    public String getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getDepartmentId() { return departmentId; }
    public int getSemester() { return semester; }
    public String getRollNumber() { return rollNumber; }
    public double getCgpa() { return cgpa; }
    public int getTotalCredits() { return totalCredits; }
    public void setCgpa(double cgpa) { this.cgpa = cgpa; }
    public void setTotalCredits(int totalCredits) { this.totalCredits = totalCredits; }
}