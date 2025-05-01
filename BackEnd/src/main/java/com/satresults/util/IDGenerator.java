package com.satresults.util;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Sorts;
import org.bson.Document;

import java.time.Year;

public class IDGenerator {
    public static String generateStudentId(String departmentCode) {
        MongoCollection<Document> collection = MongoDBConnection.getDatabase().getCollection("students");
        Document lastStudent = collection.find(Filters.eq("departmentId", departmentCode))
                .sort(Sorts.descending("id")).first();
        int nextNum = 1;
        if (lastStudent != null) {
            String lastId = lastStudent.getString("id");
            nextNum = Integer.parseInt(lastId.substring(lastId.length() - 4)) + 1;
        }
        return String.format("%d%s%04d", Year.now().getValue(), departmentCode, nextNum);
    }

    public static String generateTeacherId() {
        MongoCollection<Document> collection = MongoDBConnection.getDatabase().getCollection("teachers");
        Document lastTeacher = collection.find().sort(Sorts.descending("id")).first();
        int nextNum = 1;
        if (lastTeacher != null) {
            String lastId = lastTeacher.getString("id");
            nextNum = Integer.parseInt(lastId.substring(lastId.length() - 4)) + 1;
        }
        return String.format("%dT%04d", Year.now().getValue(), nextNum);
    }

    public static String generateGenericId(String collectionName) {
        MongoCollection<Document> collection = MongoDBConnection.getDatabase().getCollection(collectionName);
        Document lastDoc = collection.find().sort(Sorts.descending("id")).first();
        int nextNum = 1;
        if (lastDoc != null) {
            String lastId = lastDoc.getString("id");
            nextNum = Integer.parseInt(lastId) + 1;
        }
        return String.valueOf(nextNum);
    }
}