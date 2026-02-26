import type { Word, Lecture, UserWordLog } from "../types/vocab";

export interface IDataService {
    getLectures(className: string): Promise<Lecture[]>;
    getWords(lectureId: string): Promise<Word[]>;
    getUserLogs(userId: string): Promise<UserWordLog[]>;
    saveUserLog(log: UserWordLog): Promise<void>;
    addWords(words: Word[]): Promise<void>;
    addLecture(lecture: Lecture): Promise<void>;
    updateLecture(lecture: Lecture): Promise<void>;
    deleteWords(wordIds: string[]): Promise<void>;
    // For teacher dashboard
    getAllStudentLogs(className: string): Promise<Record<string, UserWordLog[]>>;
}

const MOCK_LECTURES: Lecture[] = [
    { lecture_id: "L001", class: "Standard", lecture_name: "Unit 1: Basic Verbs", order: 1 },
    { lecture_id: "L002", class: "Standard", lecture_name: "Unit 2: Daily Life", order: 2 },
];

const MOCK_WORDS: Word[] = [
    { word_id: "W001", class: "Standard", lecture_id: "L001", word: "accept", pos: "verb", meaning: "受け入れる", etymology: "ad(to) + capere(take)", derivation: "acceptance", example: "Please accept my apology.", image_prompt: "A person receiving a gift with a smile" },
    { word_id: "W002", class: "Standard", lecture_id: "L001", word: "reject", pos: "verb", meaning: "拒絶する", etymology: "re(back) + jacere(throw)", derivation: "rejection", example: "He rejected the offer.", image_prompt: "A person pushing away a contract paper" },
    { word_id: "W003", class: "Standard", lecture_id: "L001", word: "consider", pos: "verb", meaning: "よく考える", etymology: "con(with) + sider(star) -> observe stars", derivation: "consideration", example: "We will consider your proposal.", image_prompt: "A person thinking deeply looking at a star chart" },
    { word_id: "W004", class: "Standard", lecture_id: "L002", word: "habit", pos: "noun", meaning: "習慣", etymology: "habere(have)", derivation: "habitual", example: "Early rising is a good habit.", image_prompt: "A person jogging in the morning park" },
    // Add more dummy words to reach 10+ for testing
];

class MockSheetService implements IDataService {
    private STORAGE_KEY_LOGS = "grammar-app-vocab-logs";
    private STORAGE_KEY_WORDS = "grammar-app-vocab-words";

    async getLectures(className: string): Promise<Lecture[]> {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Load from storage
        const localData = localStorage.getItem("grammar-app-vocab-lectures");
        const localLectures: Lecture[] = localData ? JSON.parse(localData) : [];

        const all = [...MOCK_LECTURES, ...localLectures];
        return all.filter(l => l.class === className || className === "All");
    }

    async addLecture(lecture: Lecture): Promise<void> {
        const localData = localStorage.getItem("grammar-app-vocab-lectures");
        let localLectures: Lecture[] = localData ? JSON.parse(localData) : [];
        localLectures.push(lecture);
        localStorage.setItem("grammar-app-vocab-lectures", JSON.stringify(localLectures));
    }

    async getWords(lectureId: string): Promise<Word[]> {
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Load from local storage
        const localData = localStorage.getItem(this.STORAGE_KEY_WORDS);
        const localWords: Word[] = localData ? JSON.parse(localData) : [];

        // Note: In a real system with Delete, we'd need to know if a Mock word was deleted.
        // For this Prototype, we just return Mock + Local. 
        // If we want "Delete Mock Word", we need a "Permissions/Deleted" list.
        // Let's assume for Custom Units, only Local Words exist. 
        // For Preset Units, we just display Mock words + user added ones.

        const all = [...MOCK_WORDS, ...localWords];

        return all.filter(w => w.lecture_id === lectureId);
    }

    async addWords(words: Word[]): Promise<void> {
        const localData = localStorage.getItem(this.STORAGE_KEY_WORDS);
        let localWords: Word[] = localData ? JSON.parse(localData) : [];

        localWords = [...localWords, ...words];
        localStorage.setItem(this.STORAGE_KEY_WORDS, JSON.stringify(localWords));
    }

    async updateLecture(lecture: Lecture): Promise<void> {
        const localData = localStorage.getItem("grammar-app-vocab-lectures");
        let localLectures: Lecture[] = localData ? JSON.parse(localData) : [];

        const index = localLectures.findIndex(l => l.lecture_id === lecture.lecture_id);
        if (index >= 0) {
            localLectures[index] = lecture;
            localStorage.setItem("grammar-app-vocab-lectures", JSON.stringify(localLectures));
        } else {
            // Check MOCK_LECTURES cannot be updated in this simple mock, but we can try to shadow it?
            // For now, only Local lectures are editable fully.
            // Or assume we copy-on-write? Simpler: Just say "Can't update preset lectures" or ignore.
        }
    }

    async deleteWords(wordIds: string[]): Promise<void> {
        const localData = localStorage.getItem(this.STORAGE_KEY_WORDS);
        let localWords: Word[] = localData ? JSON.parse(localData) : [];

        const newLocalWords = localWords.filter(w => !wordIds.includes(w.word_id));
        localStorage.setItem(this.STORAGE_KEY_WORDS, JSON.stringify(newLocalWords));
    }

    async getUserLogs(userId: string): Promise<UserWordLog[]> {
        const data = localStorage.getItem(this.STORAGE_KEY_LOGS);
        if (!data) return [];
        const allLogs: UserWordLog[] = JSON.parse(data);
        return allLogs.filter(l => l.user_id === userId);
    }

    async saveUserLog(log: UserWordLog): Promise<void> {
        const data = localStorage.getItem(this.STORAGE_KEY_LOGS);
        let allLogs: UserWordLog[] = data ? JSON.parse(data) : [];

        const existingIndex = allLogs.findIndex(l => l.user_id === log.user_id && l.word_id === log.word_id);
        if (existingIndex >= 0) {
            allLogs[existingIndex] = log;
        } else {
            allLogs.push(log);
        }

        localStorage.setItem(this.STORAGE_KEY_LOGS, JSON.stringify(allLogs));
    }

    async getAllStudentLogs(_className: string): Promise<Record<string, UserWordLog[]>> {
        // Mock returning logs for all students (simulated)
        const data = localStorage.getItem(this.STORAGE_KEY_LOGS);
        if (!data) return {};
        const allLogs: UserWordLog[] = JSON.parse(data);

        // Group by user_id
        const grouped: Record<string, UserWordLog[]> = {};
        for (const log of allLogs) {
            if (!grouped[log.user_id]) grouped[log.user_id] = [];
            grouped[log.user_id].push(log);
        }
        return grouped;
    }
}

export const sheetService = new MockSheetService();
