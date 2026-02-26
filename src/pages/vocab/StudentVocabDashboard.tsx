import React, { useEffect, useState } from "react";
import type { Lecture, UserWordLog, Word } from "../../types/vocab";
import { sheetService } from "../../services/SheetService";
import { SpacedRepetitionSystem } from "../../logic/SpacedRepetition";
import styles from "./StudentVocabDashboard.module.css";
import { TestRunner } from "../../components/vocab/TestRunner";

export const StudentVocabDashboard: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [lectures, setLectures] = useState<Lecture[]>([]);
    const [logs, setLogs] = useState<UserWordLog[]>([]);
    const [allWords, setAllWords] = useState<Word[]>([]);

    const [activeSession, setActiveSession] = useState<{
        running: boolean;
        words: Word[];
    }>({ running: false, words: [] });

    // TODO: Get real user ID from context
    const USER_ID = "student_001";
    const CLASS_NAME = "Standard"; // Should come from user profile

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [lecturesData, logsData] = await Promise.all([
                sheetService.getLectures(CLASS_NAME),
                sheetService.getUserLogs(USER_ID)
            ]);
            setLectures(lecturesData);
            setLogs(logsData);

            // We need to fetch words for ALL lectures to determine global stats/weak words potentially?
            // Or lazily fetch? For dashboard "Weak Words", we need words metadata.
            // Let's fetch all words for the class for now (Mock constraint: might be slow in production if huge).
            // For now, fetch words for visible lectures.
            let wordsAccumulator: Word[] = [];
            for (const lec of lecturesData) {
                const w = await sheetService.getWords(lec.lecture_id);
                wordsAccumulator = [...wordsAccumulator, ...w];
            }
            setAllWords(wordsAccumulator);

        } catch (e) {
            console.error("Failed to load data", e);
        } finally {
            setLoading(false);
        }
    };

    const startSession = (lectureId: string) => {
        // Generate questions
        const sessionWords = SpacedRepetitionSystem.getSessionQuestions(
            allWords,
            logs,
            lectureId,
            20
        );
        setActiveSession({
            running: true,
            words: sessionWords
        });
    };

    const handleSessionComplete = () => {
        setActiveSession({ running: false, words: [] });
        loadData(); // Refresh stats
    };

    const calculateStats = () => {
        const totalLogs = logs.length;
        if (totalLogs === 0) return { accuracy: 0, streak: 0 };

        // Accuracy
        const totalCorrect = logs.reduce((acc, l) => acc + l.correct_count, 0);
        const totalAttempts = logs.reduce((acc, l) => acc + l.correct_count + l.wrong_count, 0);
        const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

        // Streak (Simplified: Consecutive days with logs? Or just "last seen" check)
        // Real implementation would need a daily activity log.
        // For now, if "last_seen" is today, streak = 1 (dummy).
        const streak = logs.some(l => l.last_seen === new Date().toISOString().split('T')[0]) ? 1 : 0;

        return { accuracy, streak };
    };

    const getWeakWords = () => {
        // Filter logs with high wrong count, join with Word data
        const weakLogs = logs.filter(l => l.wrong_count > 0).sort((a, b) => b.wrong_count - a.wrong_count).slice(0, 5);
        return weakLogs.map(l => {
            const w = allWords.find(word => word.word_id === l.word_id);
            return {
                word: w?.word || l.word_id,
                count: l.wrong_count,
                meaning: w?.meaning
            };
        });
    };

    if (activeSession.running) {
        return <TestRunner words={activeSession.words} userId={USER_ID} onComplete={handleSessionComplete} />;
    }

    if (loading) return <div>Loading...</div>;

    const stats = calculateStats();
    const weakWords = getWeakWords();

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Vocabulary Mastery</h1>
                <p style={{ color: '#6b7280' }}>Level Up Your English</p>
            </header>

            {/* Analytics */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Total Accuracy</span>
                    <span className={styles.statValue}>{stats.accuracy}%</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Day Streak</span>
                    <span className={styles.statValue}>{stats.streak}🔥</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Words Learned</span>
                    <span className={styles.statValue}>{logs.filter(l => l.correct_count > 0).length}</span>
                </div>
            </div>

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Start Learning</h2>
                <div className={styles.lectureGrid}>
                    {lectures.map(lec => (
                        <div key={lec.lecture_id} className={styles.lectureCard} onClick={() => startSession(lec.lecture_id)}>
                            <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{lec.lecture_name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Class: {lec.class}</div>
                        </div>
                    ))}
                </div>
            </div>

            {weakWords.length > 0 && (
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Weakest Words (Needs Review)</h2>
                    <div className={styles.weakWordsList}>
                        {weakWords.map((w, idx) => (
                            <div key={idx} className={styles.weakWordItem}>
                                <div>
                                    <div className={styles.weakWordText}>{w.word}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{w.meaning}</div>
                                </div>
                                <div className={styles.weakWordStats}>{w.count} mistakes</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
