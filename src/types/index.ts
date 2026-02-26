export type UserRole = 'teacher' | 'student';

export interface User {
    id: string;
    name: string;
    username: string;
    password?: string; // Storing plain text for this prototype as requested
    role: UserRole;
}

export interface Question {
    id: string;
    number: number;
    question: string;
    answer: string;
    teacherComment?: string;
}

export interface Course {
    id: string;
    title: string;
    questions: Question[];
    createdAt: number;
}

export type LearningStatus = 'unlearned' | 'known' | 'weak';

export interface QuestionProgress {
    questionId: string;
    status: LearningStatus;
    streak: number;
    lastReviewedAt: number | null; // Timestamp
    nextReviewDate: number | null; // Timestamp start of day
}

export interface StudentCourseProgress {
    studentId: string;
    courseId: string;
    totalTimeMs: number;
    questionProgress: Record<string, QuestionProgress>;
}
