import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Edit2 } from "lucide-react";
import type { Lecture, Word } from "../../../types/vocab";
import { sheetService } from "../../../services/SheetService";
import styles from "./UnitEdit.module.css";

// Reusing Button/Card components from grammar app general components if compatible,
// but for speed using standard HTML with CSS modules for now or generic style.

export const UnitEdit: React.FC = () => {
    const { lectureId } = useParams<{ lectureId: string }>();
    const navigate = useNavigate();
    const [lecture, setLecture] = useState<Lecture | null>(null);
    const [words, setWords] = useState<Word[]>([]);
    const [loading, setLoading] = useState(true);

    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editTitle, setEditTitle] = useState("");

    const [showPaste, setShowPaste] = useState(false);
    const [pasteText, setPasteText] = useState("");

    const CLASS_NAME = "Standard"; // Mock

    useEffect(() => {
        loadData();
    }, [lectureId]);

    const loadData = async () => {
        if (!lectureId) return;
        setLoading(true);
        // We need to fetch ALL lectures to find the one we are editing
        // Ideal: getLecture(id)
        const allLectures = await sheetService.getLectures(CLASS_NAME); // Assuming class 'Standard' or 'All'
        const found = allLectures.find(l => l.lecture_id === lectureId);

        if (found) {
            setLecture(found);
            setEditTitle(found.lecture_name);
            const w = await sheetService.getWords(lectureId);
            setWords(w);
        }
        setLoading(false);
    };

    const handleSaveTitle = async () => {
        if (!lecture) return;
        const updated = { ...lecture, lecture_name: editTitle };
        await sheetService.updateLecture(updated);
        setLecture(updated);
        setIsEditingTitle(false);
    };

    const handlePaste = async () => {
        if (!lecture || !pasteText) return;

        const lines = pasteText.trim().split('\n');
        const newWords: Word[] = [];
        const timestamp = Date.now();

        lines.forEach((line, idx) => {
            const parts = line.split('\t');
            if (parts.length >= 2) {
                const wordText = parts[0].trim();
                const meaningText = parts[1].trim();
                // Optional: 3rd column for Pronunciation or Example?
                // Let's assume standard 2 cols for now based on user request "estimate	推定する"

                if (wordText && meaningText) {
                    newWords.push({
                        word_id: `W_${timestamp}_${idx}`,
                        class: CLASS_NAME,
                        lecture_id: lecture.lecture_id,
                        word: wordText,
                        pos: "verb", // Default
                        meaning: meaningText,
                        image_prompt: parts[0] + " " + parts[1]
                    });
                }
            }
        });

        if (newWords.length > 0) {
            await sheetService.addWords(newWords);
            alert(`Added ${newWords.length} words!`);
            setPasteText("");
            setShowPaste(false);
            loadData();
        } else {
            alert("No valid data found. Format: Word [TAB] Meaning");
        }
    };

    const handleDeleteWord = async (wordId: string) => {
        if (!confirm("Delete this word?")) return;
        await sheetService.deleteWords([wordId]);
        loadData();
    };

    if (loading) return <div>Loading...</div>;
    if (!lecture) return <div>Unit not found</div>;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <button onClick={() => navigate("/teacher/vocab")} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <ArrowLeft size={24} />
                    </button>
                    {isEditingTitle ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input
                                className={styles.titleInput}
                                value={editTitle}
                                onChange={e => setEditTitle(e.target.value)}
                            />
                            <button onClick={handleSaveTitle} style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 8 }}>Save</button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <h1 className={styles.title}>{lecture.lecture_name}</h1>
                            <button onClick={() => setIsEditingTitle(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                                <Edit2 size={20} />
                            </button>
                        </div>
                    )}
                </div>
                <div className={styles.headerActions}>
                    <button
                        onClick={() => setShowPaste(!showPaste)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '10px 20px',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 600
                        }}
                    >
                        <Plus size={18} />
                        Bulk Add
                    </button>
                </div>
            </header>

            {showPaste && (
                <div className={styles.card} style={{ padding: 24, background: '#eff6ff' }}>
                    <h3>Paste Data (Word [TAB] Meaning)</h3>
                    <textarea
                        className={styles.pasteArea}
                        value={pasteText}
                        onChange={e => setPasteText(e.target.value)}
                        placeholder={"estimate\t推定する\nspecies\t種"}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                        <button onClick={() => setShowPaste(false)} style={{ padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer' }}>Cancel</button>
                        <button onClick={handlePaste} style={{ padding: '8px 24px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}>Add Words</button>
                    </div>
                </div>
            )}

            <div className={styles.card}>
                {words.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
                        No words in this unit. Use "Bulk Add" to start.
                    </div>
                ) : (
                    <div>
                        {words.map(w => (
                            <div key={w.word_id} className={styles.row}>
                                <div className={styles.wordContent}>
                                    <div className={styles.wordText}>{w.word}</div>
                                    <div className={styles.meaningText}>{w.meaning}</div>
                                </div>
                                <button className={styles.deleteBtn} onClick={() => handleDeleteWord(w.word_id)}>
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
