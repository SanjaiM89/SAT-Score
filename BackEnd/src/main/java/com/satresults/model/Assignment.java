package com.satresults.model;

import org.bson.Document;

import java.util.List;

public class Assignment {
    private String id;
    private String teacherId;
    private String subjectId;
    private String departmentId;
    private int semester;
    private String batch;
    private String section;
    private List<Schedule> schedule;

    public static class Schedule {
        private String day;
        private String time;
        private String room;

        public Schedule(String day, String time, String room) {
            this.day = day;
            this.time = time;
            this.room = room;
        }

        public Document toDocument() {
            return new Document("day", day)
                    .append("time", time)
                    .append("room", room);
        }

        public static Schedule fromDocument(Document doc) {
            return new Schedule(
                    doc.getString("day"),
                    doc.getString("time"),
                    doc.getString("room")
            );
        }
    }

    public Assignment(String id, String teacherId, String subjectId, String departmentId, int semester,
                      String batch, String section, List<Schedule> schedule) {
        this.id = id;
        this.teacherId = teacherId;
        this.subjectId = subjectId;
        this.departmentId = departmentId;
        this.semester = semester;
        this.batch = batch;
        this.section = section;
        this.schedule = schedule;
    }

    public Document toDocument() {
        List<Document> scheduleDocs = schedule.stream().map(Schedule::toDocument).toList();
        return new Document("id", id)
                .append("teacherId", teacherId)
                .append("subjectId", subjectId)
                .append("departmentId", departmentId)
                .append("semester", semester)
                .append("batch", batch)
                .append("section", section)
                .append("schedule", scheduleDocs);
    }

    public static Assignment fromDocument(Document doc) {
        List<Document> scheduleDocs = doc.getList("schedule", Document.class);
        List<Schedule> schedules = scheduleDocs.stream().map(Schedule::fromDocument).toList();
        return new Assignment(
                doc.getString("id"),
                doc.getString("teacherId"),
                doc.getString("subjectId"),
                doc.getString("departmentId"),
                doc.getInteger("semester"),
                doc.getString("batch"),
                doc.getString("section"),
                schedules
        );
    }

    // Getters
    public String getId() { return id; }
    public String getTeacherId() { return teacherId; }
    public String getSubjectId() { return subjectId; }
    public String getDepartmentId() { return departmentId; }
    public int getSemester() { return semester; }
    public String getBatch() { return batch; }
    public String getSection() { return section; }
    public List<Schedule> getSchedule() { return schedule; }
}