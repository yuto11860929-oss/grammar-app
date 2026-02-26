import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { storage } from '../../utils/storage';
import { repetition } from '../../utils/repetition';
import { type Course, type StudentCourseProgress } from '../../types';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import styles from './Learn.module.css';
import { useAuth } from '../../context/AuthContext';

type SessionState = 'mode_select' | 'question' | 'answer' | 'comment' | 'finished';

export const StudentLearn: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [course, setCourse] = useState<Course | null>(null);
    const [progress, setProgress] = useState<StudentCourseProgress | null>(null);

    const [queue, setQueue] = useState<{ id: string; question: string; answer: string; number: number; teacherComment?: string }[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [sessionState, setSessionState] = useState<SessionState>('mode_select');

    // Session stats
    const [sessionTotal, setSessionTotal] = useState(0);
    const [sessionCorrect, setSessionCorrect] = useState(0);

    // Timer
    const startTimeRef = useRef<number>(0);

    useEffect(() => {
        if (!courseId) return;
        const courses = storage.getCourses();
        const c = courses.find(course => course.id === courseId);
        if (c) {
            setCourse(c);
            // Load user progress
            if (user) {
                const p = storage.getStudentCourseProgress(user.id, courseId) || {
                    studentId: user.id,
                    courseId: courseId,
                    totalTimeMs: 0,
                    questionProgress: {}
                };
                setProgress(p);
            }
        }
    }, [courseId, user]);

    const startSession = (mode: 'normal' | 'weak_only') => {
        if (!course || !progress) return;

        let qList = course.questions;

        // Filter based on mode
        if (mode === 'weak_only') {
            qList = qList.filter(q => {
                const qp = progress.questionProgress[q.id];
                return qp && qp.status === 'weak';
            });
            if (qList.length === 0) {
                alert('苦手な問題はありません！通常モードで学習しましょう。');
                return;
            }
        } else {
            // Normal mode: weak cards + new cards (unknown)
            qList = [...qList].sort((a, b) => a.number - b.number);
        }

        setQueue(qList);
        setCurrentIndex(0);
        setSessionTotal(qList.length);
        setSessionCorrect(0);
        setSessionState('question');
        startTimeRef.current = Date.now();
    };

    const handleShowAnswer = () => {
        setSessionState('answer');
    };

    const handleGrade = (known: 'known' | 'weak') => {
        if (!course || !progress || !user || !courseId) return;

        const currentQ = queue[currentIndex];
        const oldQP = progress.questionProgress[currentQ.id];

        const isCorrect = known === 'known';
        // Calculate repetition
        const newQP = repetition.calculateNextState(oldQP, isCorrect);

        // Ensure we preserve the questionId
        newQP.questionId = currentQ.id;

        // Update Stats
        if (isCorrect) {
            setSessionCorrect(prev => prev + 1);
        }

        // Update Time
        const timeSpent = Date.now() - startTimeRef.current;

        const newProgress = {
            ...progress,
            totalTimeMs: progress.totalTimeMs + timeSpent,
            questionProgress: {
                ...progress.questionProgress,
                [currentQ.id]: newQP
            }
        };

        setProgress(newProgress);
        storage.saveProgress(user.id, courseId, newProgress);

        if (!isCorrect) {
            // Show teacher comment if weak
            setSessionState('comment');
        } else {
            nextCard();
        }
    };

    const nextCard = () => {
        if (currentIndex >= queue.length - 1) {
            setSessionState('finished');
        } else {
            setCurrentIndex(prev => prev + 1);
            setSessionState('question');
            startTimeRef.current = Date.now();
        }
    };

    if (!course) return null;

    // Render Helpers
    const renderModeSelect = () => (
        <div className={styles.container}>
            <header className={styles.header}>
                <Button variant="ghost" onClick={() => navigate('/student')}>
                    コース一覧に戻る
                </Button>
                <h1>{course.title}</h1>
            </header>

            <div className={styles.modeSelection}>
                <Card className={styles.modeCard} onClick={() => startSession('normal')}>
                    <h2>通常学習モード</h2>
                    <p>未学習の問題と、今日復習が必要な問題を学習します。</p>
                    <Button fullWidth>スタート</Button>
                </Card>

                <Card className={styles.modeCard} onClick={() => startSession('weak_only')}>
                    <h2>弱点克服モード</h2>
                    <p>「苦手」に設定された問題のみを重点的に復習します。</p>
                    <Button variant="secondary" fullWidth>スタート</Button>
                </Card>
            </div>
        </div>
    );

    const renderFinished = () => (
        <div className={styles.container}>
            <Card className={styles.summaryCard}>
                <h2>学習完了！</h2>
                <div className={styles.summaryStats}>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>学習した問題数</span>
                        <span className={styles.summaryValue}>{sessionTotal}</span>
                    </div>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>覚えた！</span>
                        <span className={styles.summaryValue}>{sessionCorrect}</span>
                    </div>
                </div>
                <Button fullWidth onClick={() => navigate('/student')}>
                    コース一覧に戻る
                </Button>
            </Card>
        </div>
    );

    // Main Render
    if (sessionState === 'mode_select') return renderModeSelect();
    if (sessionState === 'finished') return renderFinished();

    const currentQ = queue[currentIndex];

    return (
        <div className={styles.container}>
            <div className={styles.progressHeader}>
                <span>進捗: {currentIndex + 1} / {queue.length}</span>
                <Button variant="ghost" size="sm" onClick={() => navigate('/student')}>終了</Button>
            </div>

            <div className={styles.flashcardContainer}>
                <Card className={styles.flashcard}>
                    <div className={styles.cardContent}>
                        <div className={styles.label}>問題 {currentQ.number}</div>
                        <div className={styles.questionText}>{currentQ.question}</div>
                    </div>

                    {sessionState !== 'question' && (
                        <div className={`${styles.cardContent} ${styles.answerSection}`}>
                            <div className={styles.label}>正解</div>
                            <div className={styles.answerText}>{currentQ.answer}</div>
                            {currentQ.teacherComment && (
                                <div className={styles.comment}>
                                    <strong>解説:</strong> {currentQ.teacherComment}
                                </div>
                            )}
                        </div>
                    )}
                </Card>
            </div>

            <div className={styles.controls}>
                {sessionState === 'question' ? (
                    <Button size="lg" fullWidth onClick={handleShowAnswer}>
                        正解を表示
                    </Button>
                ) : (
                    <div className={styles.gradingButtons}>
                        <Button
                            className={styles.gradeBtn}
                            style={{ backgroundColor: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                            onClick={() => handleGrade('weak')}
                        >
                            苦手 (明日復習)
                        </Button>
                        <Button
                            className={styles.gradeBtn}
                            style={{ backgroundColor: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                            onClick={() => handleGrade('known')}
                        >
                            覚えた
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
