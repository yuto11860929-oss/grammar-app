
export type PartOfSpeech = 'noun' | 'verb' | 'adjective' | 'adverb' | 'preposition' | 'conjunction' | 'pronoun' | 'interjection' | 'phrase';

export interface Word {
    word_id: string; // Unique ID (e.g. from Sheet row number or UUID)
    class: string; // e.g., "High School 2nd Year"
    lecture_id: string;
    word: string;
    pos: PartOfSpeech;
    meaning: string;
    etymology?: string;
    derivation?: string;
    example?: string;
    pronunciation?: string; // e.g., IPA or just text for TTS
    image_prompt?: string;
}

export interface Lecture {
    lecture_id: string;
    class: string;
    lecture_name: string;
    order: number;
}

export interface UserWordLog {
    user_id: string;
    word_id: string;
    correct_count: number;
    wrong_count: number;
    last_seen: string; // ISO Display Date
    last_correct: string; // ISO Display Date
}

export interface TestSession {
    words: Word[];
    currentIndex: number;
    results: Record<string, boolean>; // word_id -> isCorrect
    startTime: number;
}
