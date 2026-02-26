import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Edit2, RefreshCw } from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { storage } from '../../utils/storage';
import { type Course, type Question } from '../../types';
import styles from './CourseEdit.module.css';

export const CourseEdit: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [course, setCourse] = useState<Course | null>(null);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editTitle, setEditTitle] = useState('');

    // Paste data state
    const [showPasteInput, setShowPasteInput] = useState(false);
    const [pasteData, setPasteData] = useState('');

    useEffect(() => {
        if (id) {
            const courses = storage.getCourses();
            const c = courses.find(course => course.id === id);
            if (c) {
                setCourse(c);
                setEditTitle(c.title);
            }
        }
    }, [id]);

    const handleSaveTitle = () => {
        if (course && editTitle.trim()) {
            const updated = { ...course, title: editTitle.trim() };
            storage.saveCourse(updated);
            setCourse(updated);
            setIsEditingTitle(false);
        }
    };

    const handlePaste = () => {
        if (!course || !pasteData) return;

        const lines = pasteData.trim().split('\n');
        const newQuestions: Question[] = [];
        let skipped = 0;
        let errors: string[] = [];
        let prevLectureName = "";

        // Format is expected to be: 講座名(optional empty after first) \t 番号 \t 問題 \t 答え
        lines.forEach((line, index) => {
            const parts = line.split('\t');
            if (parts.length >= 3) { // It might be 4 if lecture name is present, or 3 if it's implicitly inherited but split creates 4 array bounds.
                // Let's ensure robust parsing based on user's sample:
                // [講座名 (or empty)] \t [番号] \t [問題] \t [答え]
                let lectureName = "";
                let numberStr = "";
                let question = "";
                let answer = "";
                // Handle optional 5th column "解説"
                let explanation = "";

                if (parts.length >= 4) {
                    lectureName = parts[0].trim();
                    numberStr = parts[1].trim();
                    question = parts[2].trim();
                    answer = parts[3].trim();
                    if (parts.length >= 5) explanation = parts[4].trim();
                } else if (parts.length === 3) {
                    // Maybe missing lecture name entirely from the row?
                    numberStr = parts[0].trim();
                    question = parts[1].trim();
                    answer = parts[2].trim();
                }

                if (lectureName) {
                    prevLectureName = lectureName;
                } else {
                    lectureName = prevLectureName;
                }

                const number = parseInt(numberStr, 10);

                if (isNaN(number)) {
                    errors.push(`行 ${index + 1}: 番号が正しくありません。`);
                    skipped++;
                } else if (!question || !answer) {
                    errors.push(`行 ${index + 1}: 問題または答えが空白です。`);
                    skipped++;
                } else {
                    // Check for duplication in existing AND newly parsing array
                    const isDuplicate = course.questions.some(q => q.number === number) || newQuestions.some(q => q.number === number);
                    if (isDuplicate) {
                        errors.push(`行 ${index + 1}: 番号 ${number} はすでに存在するか重複しています。`);
                        // Warning but still let it pass, or prevent? User requested "警告を出す". Let's show in alert later but allow.
                    }

                    newQuestions.push({
                        id: crypto.randomUUID(),
                        number,
                        question: `[${lectureName}] ${question}`, // Prepended lecture name as requested mentally (or just stored)
                        answer,
                        teacherComment: explanation || ''
                    });
                }
            } else {
                errors.push(`行 ${index + 1}: タブの区切りが足りません。`);
                skipped++;
            }
        });

        if (errors.length > 0) {
            // Show errors but proceed with valid ones
            alert(`以下の警告/エラーがありました:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...他' : ''}`);
        }

        if (newQuestions.length > 0) {
            // Sort them
            newQuestions.sort((a, b) => a.number - b.number);

            const updatedQuestions = [...course.questions, ...newQuestions].sort((a, b) => a.number - b.number);
            const updatedCourse = { ...course, questions: updatedQuestions };

            storage.saveCourse(updatedCourse);
            setCourse(updatedCourse);
            setPasteData('');
            setShowPasteInput(false);
            alert(`${newQuestions.length} 問を一括追加しました。`);
        } else {
            alert('有効なデータが追加されませんでした。フォーマットやエラーを確認してください。');
        }
    };

    const handleDeleteQuestion = (qId: string) => {
        if (!course) return;
        if (confirm('この問題を削除しますか？')) {
            const updatedQuestions = course.questions.filter(q => q.id !== qId);
            const updatedCourse = { ...course, questions: updatedQuestions };
            storage.saveCourse(updatedCourse);
            setCourse(updatedCourse);
        }
    };

    if (!course) return <div>Loading...</div>;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <Button variant="ghost" onClick={() => navigate('/teacher')}>
                        <ArrowLeft size={18} style={{ marginRight: '0.5rem' }} />
                        コース一覧に戻る
                    </Button>
                    <div className={styles.titleSection}>
                        {isEditingTitle ? (
                            <div className={styles.editTitleForm}>
                                <Input
                                    value={editTitle}
                                    onChange={e => setEditTitle(e.target.value)}
                                    autoFocus
                                />
                                <Button size="sm" onClick={handleSaveTitle}>保存</Button>
                                <Button size="sm" variant="ghost" onClick={() => setIsEditingTitle(false)}>キャンセル</Button>
                            </div>
                        ) : (
                            <div className={styles.titleDisplay}>
                                <h1 className={styles.title}>{course.title}</h1>
                                <button onClick={() => setIsEditingTitle(true)} className={styles.iconBtn}>
                                    <Edit2 size={18} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <div className={styles.headerActions}>
                    <Button variant="secondary" onClick={() => {
                        if (confirm('すべての学習履歴をリセットしますか？')) {
                            // logic to reset progress would go here
                            alert('まだ実装されていません');
                        }
                    }}>
                        <RefreshCw size={18} style={{ marginRight: '0.5rem' }} />
                        進捗リセット
                    </Button>
                    <Button onClick={() => setShowPasteInput(!showPasteInput)}>
                        <Plus size={18} style={{ marginRight: '0.5rem' }} />
                        一括追加
                    </Button>
                </div>
            </header>

            {showPasteInput && (
                <Card className={styles.pasteCard}>
                    <h3>Excel/スプレッドシートからデータを貼り付け</h3>
                    <p className={styles.instruction}>
                        以下のTSV形式（タブ区切り）のデータをコピーして貼り付けてください: <br />
                        <code>[講座名] [番号] [問題] [答え] [解説(任意)]</code>
                    </p>
                    <textarea
                        className={styles.pasteArea}
                        rows={10}
                        placeholder={"時制(1)\t1\t現在形の意味と考え方は？\t「現在形」＝「現在・過去・未来形」と考える！\n\t2\t進行形はどうやって作る？\tbe動詞＋ing"}
                        value={pasteData}
                        onChange={e => setPasteData(e.target.value)}
                    />
                    <div className={styles.pasteActions}>
                        <Button variant="ghost" onClick={() => setShowPasteInput(false)}>キャンセル</Button>
                        <Button onClick={handlePaste}>追加・更新</Button>
                    </div>
                </Card>
            )}

            <div className={styles.questionsList}>
                {course.questions.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>問題が登録されていません。「一括追加」から問題を追加してください。</p>
                    </div>
                ) : (
                    course.questions.sort((a, b) => a.number - b.number).map(q => (
                        <Card key={q.id} className={styles.questionRow}>
                            <div className={styles.qHeader}>
                                <div className={styles.qNumber}>No. {q.number}</div>
                                <div className={styles.qActions}>
                                    <button onClick={() => handleDeleteQuestion(q.id)} className={styles.deleteBtn}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className={styles.qContent}>
                                <div className={styles.qItem}>
                                    <span className={styles.label}>問題:</span>
                                    <span>{q.question}</span>
                                </div>
                                <div className={styles.qItem}>
                                    <span className={styles.label}>答え:</span>
                                    <span>{q.answer}</span>
                                </div>
                                {q.teacherComment && (
                                    <div className={styles.qItem}>
                                        <span className={styles.label}>解説:</span>
                                        <span>{q.teacherComment}</span>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};
