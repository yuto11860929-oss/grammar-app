import { type Course, type StudentCourseProgress, type User } from '../types';

const KEYS = {
    COURSES: 'grammar_app_courses',
    PROGRESS: 'grammar_app_progress',
    USERS: 'grammar_app_users',
};

// Initialize default teachers if not exists
const initUsers = () => {
    let users: User[] = [];
    try {
        const data = localStorage.getItem(KEYS.USERS);
        users = data ? JSON.parse(data) : [];
    } catch (e) {
        users = [];
    }

    const defaultTeachers: User[] = [
        {
            id: 'teacher-1',
            username: 'teacher',
            password: 'password',
            name: 'デフォルト先生',
            role: 'teacher'
        },
        {
            id: 'teacher-yuto',
            username: 'Yuto',
            password: 'teacher1',
            name: 'Yuto先生',
            role: 'teacher'
        },
        {
            id: 'teacher-ashida',
            username: 'Ashida',
            password: 'teacher2',
            name: 'Ashida先生',
            role: 'teacher'
        },
        // Valid demo student for verification
        {
            id: 'student-demo',
            username: 'student',
            password: 'password',
            name: 'デモ生徒',
            role: 'student'
        }
    ];

    // Merge defaults ensuring we don't duplicate by username
    let changed = false;
    defaultTeachers.forEach(def => {
        if (!users.some(u => u.username === def.username)) {
            users.push(def);
            changed = true;
        }
    });

    if (changed) { // Removed users.length === 0 check to prevent overwrite if empty array is valid but we want defaults
        localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    }
};

const initDemoCourses = () => {
    try {
        const data = localStorage.getItem(KEYS.COURSES);
        if (data && JSON.parse(data).length > 0) return; // Already has data

        const demoCourses: Course[] = [
            {
                id: 'demo-course-1',
                title: '中学英文法 (Sample)',
                questions: [
                    { id: 'q1', number: 1, question: 'This is a pen.', answer: 'これはペンです。', teacherComment: '基本文型' },
                    { id: 'q2', number: 2, question: 'I play soccer.', answer: '私はサッカーをします。', teacherComment: '一般動詞' },
                    { id: 'q3', number: 3, question: 'She is happy.', answer: '彼女は幸せです。', teacherComment: 'Be動詞' },
                ],
                createdAt: Date.now()
            },
            {
                id: 'demo-course-2',
                title: '英単語ターゲット (Sample)',
                questions: [
                    { id: 'w1', number: 1, question: 'Apple', answer: 'りんご', teacherComment: '' },
                    { id: 'w2', number: 2, question: 'Run', answer: '走る', teacherComment: '' },
                    { id: 'w3', number: 3, question: 'Beautiful', answer: '美しい', teacherComment: '' },
                ],
                createdAt: Date.now()
            }
        ];

        localStorage.setItem(KEYS.COURSES, JSON.stringify(demoCourses));
    } catch (e) {
        console.error('Failed to init demo courses', e);
    }
};

export const storage = {
    // --- Courses ---
    getCourses: (): Course[] => {
        initDemoCourses(); // Ensure demo data exists
        try {
            const data = localStorage.getItem(KEYS.COURSES);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Failed to load courses', e);
            return [];
        }
    },

    saveCourses: (courses: Course[]) => {
        localStorage.setItem(KEYS.COURSES, JSON.stringify(courses));
    },

    getCourse: (id: string): Course | undefined => {
        const courses = storage.getCourses();
        return courses.find(c => c.id === id);
    },

    saveCourse: (course: Course) => {
        const courses = storage.getCourses();
        const index = courses.findIndex(c => c.id === course.id);
        if (index >= 0) {
            courses[index] = course;
        } else {
            courses.push(course);
        }
        storage.saveCourses(courses);
    },

    // --- Users ---
    getUsers: (): User[] => {
        initUsers();
        try {
            const data = localStorage.getItem(KEYS.USERS);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    },

    saveUsers: (users: User[]) => {
        localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    },

    getUserByUsername: (username: string): User | undefined => {
        const users = storage.getUsers();
        return users.find(u => u.username === username);
    },

    // --- Progress ---
    // Get all progress for a specific student
    getStudentProgress: (studentId: string): Record<string, StudentCourseProgress> => {
        try {
            const data = localStorage.getItem(KEYS.PROGRESS);
            const allProgress = data ? JSON.parse(data) : {};
            return allProgress[studentId] || {};
        } catch (e) {
            console.error('Failed to load progress', e);
            return {};
        }
    },

    getStudentCourseProgress: (studentId: string, courseId: string): StudentCourseProgress | null => {
        const studentData = storage.getStudentProgress(studentId);
        return studentData[courseId] || null;
    },

    saveProgress: (studentId: string, courseId: string, progress: StudentCourseProgress) => {
        const data = localStorage.getItem(KEYS.PROGRESS);
        const allProgress = data ? JSON.parse(data) : {};

        if (!allProgress[studentId]) {
            allProgress[studentId] = {};
        }
        allProgress[studentId][courseId] = progress;

        localStorage.setItem(KEYS.PROGRESS, JSON.stringify(allProgress));
    },

    // Helper to clear data (for debugging)
    clearAll: () => {
        localStorage.removeItem(KEYS.COURSES);
        localStorage.removeItem(KEYS.PROGRESS);
        localStorage.removeItem(KEYS.USERS);
    }
};
