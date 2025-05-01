package com.satresults.util;

import java.util.Map;

public class GradeCalculator {
    private static final Map<String, Integer> GRADE_POINTS = Map.of(
            "O", 10, "A+", 9, "A", 8, "B+", 7, "B", 6, "C", 5, "F", 0
    );

    public static String calculateGrade(double totalMarks) {
        if (totalMarks >= 90) return "O";
        if (totalMarks >= 80) return "A+";
        if (totalMarks >= 70) return "A";
        if (totalMarks >= 60) return "B+";
        if (totalMarks >= 50) return "B";
        if (totalMarks >= 40) return "C";
        return "F";
    }

    public static double calculateCGPA(double totalGradePoints, int totalCredits) {
        return totalCredits > 0 ? totalGradePoints / totalCredits : 0.0;
    }

    public static int getGradePoint(String grade) {
        return GRADE_POINTS.getOrDefault(grade, 0);
    }
}