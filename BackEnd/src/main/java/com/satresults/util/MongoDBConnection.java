package com.satresults.util;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;

public class MongoDBConnection {
    private static final MongoClient client;
    private static final MongoDatabase database;

    static {
        String uri = EnvUtil.get("MONGODB_URI");
        if (uri == null) {
            throw new RuntimeException("MONGODB_URI not set in .env");
        }
        client = MongoClients.create(uri);
        database = client.getDatabase("sat_results");
    }

    public static MongoDatabase getDatabase() {
        return database;
    }

    public static void close() {
        client.close();
    }
}