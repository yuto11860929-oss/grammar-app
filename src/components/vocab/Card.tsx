import React, { useEffect } from "react";
import type { Word } from "../../types/vocab";
import styles from "./Card.module.css";
import { Volume2, Search } from "lucide-react";

interface CardProps {
    word: Word;
    mode: "RECOGNITION" | "RECALL"; // Phase A (Recog) or B (Recall)
    showAnswer: boolean;
    onFlip: () => void;
}

export const Card: React.FC<CardProps> = ({ word, mode, showAnswer, onFlip }) => {
    // Generate a mock image URL or usage of image_prompt
    useEffect(() => {
        // In a real app, we would fetch the image. 
        // For now, use a placeholder provided by a service or just a gradient/text.
        // Let's use a reliable placeholder service if possible, or just color.
        // Using a nice gradient/placeholder for now.
    }, [word]);

    const speak = (e: React.MouseEvent) => {
        e.stopPropagation();
        const utterance = new SpeechSynthesisUtterance(word.word);
        utterance.lang = "en-US";
        window.speechSynthesis.speak(utterance);
    };

    const googleSearch = (e: React.MouseEvent) => {
        e.stopPropagation();
        window.open(`https://www.google.com/search?q=${word.word}+意味`, "_blank");
    };

    // Phase A: Front = English (Word), Back = Japanese (Meaning) + Details
    // Phase B: Front = Japanese (Meaning), Back = English (Word) + Details

    return (
        <div className={styles.cardContainer} onClick={onFlip}>
            <div className={`${styles.cardInner} ${showAnswer ? styles.flipped : ""}`}>

                {/* FRONT FACE */}
                <div className={styles.cardFront}>
                    {mode === "RECOGNITION" ? (
                        <>
                            <div className={styles.pos}>{word.pos}</div>
                            <div className={styles.word}>{word.word}</div>
                        </>
                    ) : (
                        <>
                            <div className={styles.label}>Meaning</div>
                            <div className={styles.meaning}>{word.meaning}</div>
                        </>
                    )}

                    {/* Always show Search on Front? No, maybe only on Word side. */}
                    {/* If Recall (Meaning shown), showing Word button defeats purpose? No, we need prompt. */}

                    <div className={styles.imagePlaceholder}>
                        {/* AI Image Placeholder */}
                        {word.image_prompt ? <span>Prompt: {word.image_prompt}</span> : <span>No Image</span>}
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#999' }}>Tap to Flip</div>
                </div>

                {/* BACK FACE (Full Details) */}
                <div className={styles.cardBack}>
                    <div className={styles.sectionTitle}>Answer</div>

                    <div className={styles.word}>{word.word}</div>
                    <div className={styles.meaning}>{word.meaning}</div>

                    <div className={styles.actions}>
                        <button className={styles.iconBtn} onClick={speak} title="Pronunciation">
                            <Volume2 size={24} />
                        </button>
                        <button className={styles.iconBtn} onClick={googleSearch} title="Google Search">
                            <Search size={24} />
                        </button>
                    </div>

                    <div style={{ width: '100%', marginTop: '1rem' }}>
                        {word.example && (
                            <div className={styles.detailRow}>
                                <span className={styles.label}>Example</span>
                                <div className={styles.text}>{word.example}</div>
                            </div>
                        )}
                        {word.etymology && (
                            <div className={styles.detailRow}>
                                <span className={styles.label}>Etymology</span>
                                <div className={styles.text}>{word.etymology}</div>
                            </div>
                        )}
                        {word.derivation && (
                            <div className={styles.detailRow}>
                                <span className={styles.label}>Derivation</span>
                                <div className={styles.text}>{word.derivation}</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
