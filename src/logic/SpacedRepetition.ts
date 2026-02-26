import type { Word, UserWordLog } from "../types/vocab";
import { differenceInDays, parseISO } from "date-fns";

export class SpacedRepetitionSystem {

    /**
     * Selects 20 questions based on the logic:
     * 40% High Wrong Count (Priority 1)
     * 40% Newest Lecture Words (Priority 2)
     * 20% Oldest / Forgotten Words (Priority 3)
     */
    static getSessionQuestions(
        allWords: Word[],
        userLogs: UserWordLog[],
        targetLectureId: string, // The lecture user clicked on
        limit: number = 20
    ): Word[] {
        const today = new Date();

        // 1. Identify "New" words (from the target lecture)
        // Actually, "New" might just mean "belonging to relevant lectures".
        // For now, let's assume specific lecture focus, but "Review" should include others.
        // Spec says: "Selected Lecture... Filter"
        // "Wrong count high", "Last seen old".

        // However, the rule says "20 Questions Test" has a ratio.
        // "Wrong words: 40%", "Latest Lecture: 40%", "Old words: 20%"
        // This implies we need access to ALL words for the "Wrong" and "Old" categories, 
        // OR we are only testing within the lecture?
        // "出題ロジック（通常学習）: Selected Lecture -> Sort by Wrong/Old". This seems to be "Study Mode".
        // "20問テスト": This seems to be "Test Mode" which might technically span broadly?
        // The spec says: "Wrong words (40%), Latest Lecture words (40%), Old words (20%)".
        // "Latest Lecture" implies the one currently being studied.

        // Let's implement the "20 Question Test" mixed logic.

        const logsMap = new Map<string, UserWordLog>();
        userLogs.forEach(l => logsMap.set(l.word_id, l));

        // Helper to get stats
        const getWrongCount = (w: Word) => logsMap.get(w.word_id)?.wrong_count || 0;

        // 1. New/Latest Lecture Words (Target)
        const newWords = allWords.filter(w => w.lecture_id === targetLectureId);

        // 2. Wrong Words (Global or restricted to class? Assuming Global for now, or Class-based if needed)
        // Spec: "Teacher manages... Class...". Words should probably be filtered by the student's Class.
        // Assuming 'allWords' passed in are already filtered by the Student's Class.

        const wrongWords = [...allWords].filter(w => getWrongCount(w) > 0);
        wrongWords.sort((a, b) => getWrongCount(b) - getWrongCount(a)); // Descending wrong count

        // 3. Old Words (Last seen > 7 days, or just oldest)
        const oldWords = [...allWords].filter(w => {
            const lastSeenStr = logsMap.get(w.word_id)?.last_seen;
            if (!lastSeenStr) return false; // Never seen is not "Old", it's "New" or "Unstudied"
            const days = differenceInDays(today, parseISO(lastSeenStr));
            return days > 7;
        });
        oldWords.sort((a, b) => {
            const dateA = logsMap.get(a.word_id)?.last_seen || "";
            const dateB = logsMap.get(b.word_id)?.last_seen || "";
            return dateA.localeCompare(dateB); // Ascending date (Older first)
        });

        // Quotas
        const countTotal = limit;
        const countWrong = Math.floor(countTotal * 0.4); // 8
        const countNew = Math.floor(countTotal * 0.4);   // 8
        const countOld = countTotal - countWrong - countNew; // 4

        const selected: Set<Word> = new Set();

        // Helper to add unique words
        const fill = (source: Word[], count: number) => {
            let added = 0;
            for (const w of source) {
                if (added >= count) break;
                if (!selected.has(w)) {
                    selected.add(w);
                    added++;
                }
            }
        };

        // 1. Fill Priority: Wrong (Top 8)
        fill(wrongWords, countWrong);

        // 2. Fill Priority: New (Target Lecture)
        // Shuffle new words first so we don't always get the first 8 alphabetically
        const shuffledNew = [...newWords].sort(() => Math.random() - 0.5);
        fill(shuffledNew, countNew);

        // 3. Fill Priority: Old
        fill(oldWords, countOld);

        // 4. Backfill if short (use New/Target Lecture first, then Random from all)
        if (selected.size < limit) {
            fill(shuffledNew, limit - selected.size);
        }
        if (selected.size < limit) {
            const allShuffled = [...allWords].sort(() => Math.random() - 0.5);
            fill(allShuffled, limit - selected.size);
        }

        // Return randomized list
        return Array.from(selected).sort(() => Math.random() - 0.5);
    }

    static createOrUpdateLog(
        existingLog: UserWordLog | undefined,
        userId: string,
        wordId: string,
        isCorrect: boolean
    ): UserWordLog {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        if (!existingLog) {
            return {
                user_id: userId,
                word_id: wordId,
                correct_count: isCorrect ? 1 : 0,
                wrong_count: isCorrect ? 0 : 1,
                last_seen: today,
                last_correct: isCorrect ? today : "2000-01-01"
            };
        }

        return {
            ...existingLog,
            correct_count: existingLog.correct_count + (isCorrect ? 1 : 0),
            wrong_count: existingLog.wrong_count + (isCorrect ? 0 : 1),
            last_seen: today,
            last_correct: isCorrect ? today : existingLog.last_correct
        };
    }
}
