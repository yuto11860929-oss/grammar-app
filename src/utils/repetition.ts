import { type QuestionProgress } from '../types';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const repetition = {
    calculateNextState: (
        currentProgress: QuestionProgress | undefined,
        isCorrect: boolean
    ): QuestionProgress => {
        const now = Date.now();
        const todayStart = new Date().setHours(0, 0, 0, 0);

        // Initial state if undefined
        if (!currentProgress) {
            return {
                questionId: '', // Will be filled by caller or ignored here
                status: isCorrect ? 'known' : 'weak',
                streak: isCorrect ? 1 : 0,
                lastReviewedAt: now,
                nextReviewDate: todayStart + ONE_DAY_MS, // Review tomorrow
            };
        }

        let { status, streak } = currentProgress;
        let nextReviewDate = todayStart + ONE_DAY_MS;

        if (isCorrect) {
            // Logic:
            // Known 2 consecutive -> 3 days
            // Further known -> 7 days

            // If it was weak, it becomes known (streak 1) -> Review tomorrow
            if (status === 'weak' || status === 'unlearned') {
                status = 'known';
                streak = 1;
                nextReviewDate = todayStart + ONE_DAY_MS;
            } else {
                // Was already known
                streak += 1;
                if (streak === 2) {
                    nextReviewDate = todayStart + (3 * ONE_DAY_MS);
                } else if (streak >= 3) {
                    nextReviewDate = todayStart + (7 * ONE_DAY_MS);
                } else {
                    // Streak 1
                    nextReviewDate = todayStart + ONE_DAY_MS;
                }
            }
        } else {
            // Incorrect -> Become Weak, Streak 0, Review tomorrow
            status = 'weak';
            streak = 0;
            nextReviewDate = todayStart + ONE_DAY_MS;
        }

        return {
            ...currentProgress,
            status,
            streak,
            lastReviewedAt: now,
            nextReviewDate,
        };
    }
};
