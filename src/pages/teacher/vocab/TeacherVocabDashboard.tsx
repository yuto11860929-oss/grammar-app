import React, { useEffect, useState } from "react";
import type { Word, Lecture } from "../../../types/vocab";
import { sheetService } from "../../../services/SheetService";
import styles from "./TeacherVocabDashboard.module.css";
import { differenceInDays, parseISO } from "date-fns";

interface StudentStats {
    id: string;
    name: string; // Mock name
    accuracy: number;
    lastActive: string;
    inactiveWarning: boolean;
    weakWords: string[];
}

import { useNavigate } from "react-router-dom";

export const TeacherVocabDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<StudentStats[]>([]);
    const [loading, setLoading] = useState(true);

    const CLASS_NAME = "Standard"; // Mock Class Selector

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch all logs for the class
            const allLogsMap = await sheetService.getAllStudentLogs(CLASS_NAME);

            // Since we don't have a "User" database service mocked properly with names,
            // we'll iterate the logs keys (userIds) and generate stats.
            // In a real app, we'd join with a User table.

            // Let's also fetch words to map IDs to text
            // Ideally we should cache this or fetch only needed.
            // For now, fetch a sample lecture to get some words, or just show IDs if Words not found?
            // Better to fetch all words for the class.
            const lectures = await sheetService.getLectures(CLASS_NAME);
            let allWords: Word[] = [];
            for (const lec of lectures) {
                const w = await sheetService.getWords(lec.lecture_id);
                allWords = [...allWords, ...w];
            }

            const computedStats: StudentStats[] = Object.keys(allLogsMap).map(userId => {
                const logs = allLogsMap[userId];

                const totalCorrect = logs.reduce((acc, l) => acc + l.correct_count, 0);
                const totalAttempts = logs.reduce((acc, l) => acc + l.correct_count + l.wrong_count, 0);
                const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

                // Last Active: simple max of last_seen
                const lastActive = logs.reduce((max, l) => l.last_seen > max ? l.last_seen : max, "2000-01-01");

                // Inactive Warning: > 7 days
                const diff = differenceInDays(new Date(), parseISO(lastActive));
                const inactiveWarning = diff > 7;

                // Weak Words: Top 3
                const weak = logs.filter(l => l.wrong_count > 0)
                    .sort((a, b) => b.wrong_count - a.wrong_count)
                    .slice(0, 3);

                const weakWordTexts = weak.map(l => {
                    const w = allWords.find(wd => wd.word_id === l.word_id);
                    return w ? w.word : l.word_id; // Fallback to ID
                });

                return {
                    id: userId,
                    name: userId === "student_001" ? "Mock Student (You)" : `Student ${userId}`, // Mock name mapping
                    accuracy,
                    lastActive,
                    inactiveWarning,
                    weakWords: weakWordTexts
                };
            });

            setStats(computedStats);

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const [importText, setImportText] = useState("");
    const [selectedLecture, setSelectedLecture] = useState("");
    const [showImport, setShowImport] = useState(false);
    const [lectures, setLectures] = useState<Lecture[]>([]); // Need to load lectures

    // Load lectures too
    useEffect(() => {
        sheetService.getLectures(CLASS_NAME).then(setLectures);
    }, []);

    const handleImport = async () => {
        if (!selectedLecture || !importText) {
            alert("Please select a lecture and enter text.");
            return;
        }

        // Parse TSV
        // Format: word \t meaning
        const lines = importText.split(/\n/);
        const newWords: Word[] = [];
        const timestamp = Date.now();

        lines.forEach((line, idx) => {
            const parts = line.split(/\t/);
            if (parts.length >= 2) {
                const wordText = parts[0].trim();
                const meaningText = parts[1].trim();
                if (wordText && meaningText) {
                    newWords.push({
                        word_id: `IMPORTED_${timestamp}_${idx}`, // Simple ID generation
                        class: CLASS_NAME,
                        lecture_id: selectedLecture,
                        word: wordText,
                        pos: "verb", // Default fallback to verb or noun to satisfy type constraints
                        meaning: meaningText,
                        image_prompt: parts[0] + " " + parts[1] // Simple prompt
                    });
                }
            }
        });

        if (newWords.length > 0) {
            await sheetService.addWords(newWords);
            alert(`Added ${newWords.length} words!`);
            setImportText("");
            setShowImport(false);
            loadData(); // Refresh stats (though stats rely on logs, words are needed for mapping)
        } else {
            alert("No valid lines found. Format: Word [TAB] Meaning");
        }
    };

    const [newLectureName, setNewLectureName] = useState("");
    const [showCreateLecture, setShowCreateLecture] = useState(false);

    const handleCreateLecture = async () => {
        if (!newLectureName) return;
        const newLecture: Lecture = {
            lecture_id: `L_${Date.now()}`,
            class: CLASS_NAME,
            lecture_name: newLectureName,
            order: lectures.length + 1
        };
        await sheetService.addLecture(newLecture);
        alert("Unit Created!");
        setNewLectureName("");
        setShowCreateLecture(false);
        // Refresh lectures list
        sheetService.getLectures(CLASS_NAME).then(setLectures);
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 className={styles.title}>Vocabulary Progress: {CLASS_NAME}</h1>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => setShowCreateLecture(!showCreateLecture)}
                            style={{
                                padding: '10px 20px',
                                background: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 600
                            }}
                        >
                            {showCreateLecture ? "Cancel Unit" : "+ Create Unit"}
                        </button>
                        <button
                            onClick={() => setShowImport(!showImport)}
                            style={{
                                padding: '10px 20px',
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 600
                            }}
                        >
                            {showImport ? "Cancel Import" : "+ Import Words"}
                        </button>
                    </div>
                </div>
            </header>

            {showCreateLecture && (
                <div className={styles.tableCard} style={{ padding: '24px', background: '#ecfdf5', marginBottom: '32px' }}>
                    <h3 className={styles.tableTitle} style={{ marginBottom: '16px' }}>Create New Unit</h3>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <input
                            type="text"
                            value={newLectureName}
                            onChange={(e) => setNewLectureName(e.target.value)}
                            placeholder="Unit Name (e.g. Chapter 5)"
                            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                        />
                        <button
                            onClick={handleCreateLecture}
                            style={{
                                padding: '10px 24px',
                                background: '#059669',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 600
                            }}
                        >
                            Create
                        </button>
                    </div>
                </div>
            )}

            {showImport && (
                <div className={styles.tableCard} style={{ padding: '24px', background: '#eff6ff', marginBottom: '32px' }}>
                    <h3 className={styles.tableTitle} style={{ marginBottom: '16px' }}>Bulk Import (TSV)</h3>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Target Lecture</label>
                        <select
                            value={selectedLecture}
                            onChange={e => setSelectedLecture(e.target.value)}
                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '200px' }}
                        >
                            <option value="">-- Select Lecture --</option>
                            {lectures.map(l => (
                                <option key={l.lecture_id} value={l.lecture_id}>{l.lecture_name}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Paste Data (Word [TAB] Meaning)</label>
                        <textarea
                            value={importText}
                            onChange={e => setImportText(e.target.value)}
                            placeholder={"estimate\t推定する\nspecies\t種"}
                            style={{ width: '100%', height: '150px', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontFamily: 'monospace' }}
                        />
                    </div>
                    <button
                        onClick={handleImport}
                        style={{
                            padding: '10px 24px',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 600
                        }}
                    >
                        Save Words
                    </button>
                </div>
            )}

            {/* Units Management List */}
            <div className={styles.tableCard} style={{ marginBottom: 32 }}>
                <div className={styles.tableHeader}>
                    <span className={styles.tableTitle}>Managed Units</span>
                </div>
                <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
                    {lectures.map(l => (
                        <div key={l.lecture_id}
                            style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, cursor: 'pointer', background: 'white' }}
                            onClick={() => navigate(`/teacher/vocab/unit/${l.lecture_id}`)}
                        >
                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: 4 }}>{l.lecture_name}</div>
                            <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>{l.class}</div>
                            <div style={{ marginTop: 12, color: '#3b82f6', fontWeight: 600, fontSize: '0.9rem' }}>Click to Edit →</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.tableCard}>
                <div className={styles.tableHeader}>
                    <span className={styles.tableTitle}>Student Performance</span>
                </div>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.th}>Student</th>
                            <th className={styles.th}>Accuracy</th>
                            <th className={styles.th}>Last Active</th>
                            <th className={styles.th}>Status</th>
                            <th className={styles.th}>Weak Words (Top 3)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.map(s => (
                            <tr key={s.id} className={styles.tr}>
                                <td className={styles.td}>
                                    <div style={{ fontWeight: 600 }}>{s.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#999' }}>{s.id}</div>
                                </td>
                                <td className={styles.td}>
                                    <div style={{
                                        color: s.accuracy >= 80 ? '#059669' : s.accuracy < 50 ? '#dc2626' : '#d97706',
                                        fontWeight: 'bold'
                                    }}>
                                        {s.accuracy}%
                                    </div>
                                </td>
                                <td className={styles.td}>{s.lastActive}</td>
                                <td className={styles.td}>
                                    {s.inactiveWarning ? (
                                        <span className={`${styles.badge} ${styles.badgeWarning}`}>Inactive</span>
                                    ) : (
                                        <span className={`${styles.badge} ${styles.badgeSuccess}`}>Active</span>
                                    )}
                                </td>
                                <td className={styles.td}>
                                    <div className={styles.weakWords}>
                                        {s.weakWords.join(", ") || "-"}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
