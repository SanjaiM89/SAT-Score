package com.satresults.model;

import org.bson.Document;

public class Admin {
    private String id;
    private String username;
    private String password;

    public Admin(String id, String username, String password) {
        this.id = id;
        this.username = username;
        this.password = password;
    }

    public Document toDocument() {
        return new Document("id", id)
                .append("username", username)
                .append("password", password);
    }

    public static Admin fromDocument(Document doc) {
        return new Admin(
                doc.getString("id"),
                doc.getString("username"),
                doc.getString("password")
        );
    }

    // Getters
    public String getId() { return id; }
    public String getUsername() { return username; }
    public String getPassword() { return password; }
}