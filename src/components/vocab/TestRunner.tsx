import React, { useState } from "react";
import type { Word, UserWordLog } from "../../types/vocab";
import { Card } from "./Card";
import { SpacedRepetitionSystem } from "../../logic/SpacedRepetition";
import { sheetService } from "../../services/SheetService";
import styles from "./TestRunner.module.css";
// import { useNavigate } from "react-router-dom";

interface TestRunnerProps {
    words: Word[];
    userId: string;
    onComplete: () => void;
}

type Phase = "PHASE_A" | "PHASE_B";

export const TestRunner: React.FC<TestRunnerProps> = ({ words, userId, onComplete }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [phase, setPhase] = useState<Phase>("PHASE_A");
    const [showAnswer, setShowAnswer] = useState(false);
    // const [results, setResults] = useState<{ wordId: string; correctA: boolean; correctB: boolean }[]>([]); // simplified logic doesn't store this array locally

    // If no words, finish
    if (words.length === 0) {
        return <div>No words loaded.</div>;
    }

    const currentWord = words[currentIndex];

    const handleFlip = () => {
        setShowAnswer(true);
    };

    const handleResult = async (isCorrect: boolean) => {
        // Logic:
        // If Phase A: 
        //   If Correct -> Go to Phase B (Same word).
        //   If Wrong -> Mark as Wrong for this word (Global Result), Skip Phase B? 
        //      *Spec*: "Phase Bで正解したときのみ correct_count + 1". 
        //      Also "間違えた場合: wrong_count + 1".
        //      Usually, if you fail Recognition (A), you don't do Recall (B) effectively, or you failed the word.
        //      Let's assume: Fail A -> Fail Word. Pass A -> Try B. Pass B -> Pass Word.

        // Actually, prompt says: "Phase Bで正解したときのみ correct_count を 1 増やす".
        // "Phase A" is a prerequisite?

        if (phase === "PHASE_A") {
            if (isCorrect) {
                // Proceed to Phase B
                setPhase("PHASE_B");
                setShowAnswer(false);
            } else {
                // Failed Phase A
                await recordResult(currentWord.word_id, false); // Failed
                nextWord();
            }
        } else {
            // Phase B
            await recordResult(currentWord.word_id, isCorrect);
            nextWord();
        }
    };

    const recordResult = async (wordId: string, finalSuccess: boolean) => {
        // Fetch existing logs to ensure fresh state if needed, or rely on caller?
        // For simplicity/performance, we read -> update -> write specific log.
        const logs = await sheetService.getUserLogs(userId);
        const existing = logs.find(l => l.word_id === wordId);
        const newLog = SpacedRepetitionSystem.createOrUpdateLog(existing, userId, wordId, finalSuccess);
        await sheetService.saveUserLog(newLog);
    };

    const nextWord = () => {
        if (currentIndex < words.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setPhase("PHASE_A");
            setShowAnswer(false);
        } else {
            onComplete();
        }
    };

    const progress = ((currentIndex) / words.length) * 100;

    return (
        <div className={styles.container}>
            <div className={styles.progress}>
                <div className={styles.progressBar} style={{ width: `${progress}%` }} />
            </div>

            <div style={{ marginBottom: 10, color: '#666' }}>
                Question {currentIndex + 1} / {words.length} • {phase === "PHASE_A" ? "Recognition" : "Recall"}
            </div>

            <Card
                word={currentWord}
                mode={phase === "PHASE_A" ? "RECOGNITION" : "RECALL"}
                showAnswer={showAnswer}
                onFlip={handleFlip}
            />

            {showAnswer && (
                <div className={styles.controls}>
                    <button className={`${styles.button} ${styles.wrongBtn}`} onClick={() => handleResult(false)}>
                        Wrong
                    </button>
                    <button className={`${styles.button} ${styles.correctBtn}`} onClick={() => handleResult(true)}>
                        Correct
                    </button>
                </div>
            )}
        </div>
    );
};
