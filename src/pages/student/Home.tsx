import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Folder, ChevronRight, CheckSquare, AlertCircle, Settings, LogOut, Clock } from 'lucide-react';
import { storage } from '../../utils/storage';
import { type Course, type StudentCourseProgress } from '../../types';
import styles from './Home.module.css';
import { useAuth } from '../../context/AuthContext';

export const StudentHome: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [courses, setCourses] = useState<Course[]>([]);
    const [progressData, setProgressData] = useState<Record<string, StudentCourseProgress>>({});

    useEffect(() => {
        setCourses(storage.getCourses());
        if (user) {
            setProgressData(storage.getStudentProgress(user.id));
        }
    }, [user]);

    const getCourseStats = (course: Course) => {
        const prog = progressData[course.id];
        const totalQuestions = course.questions.length;

        if (!prog || totalQuestions === 0) {
            return { weakCount: 0, knownCount: 0, totalQuestions: totalQuestions || 0 };
        }

        let knownCount = 0;
        let weakCount = 0;

        course.questions.forEach(q => {
            const p = prog.questionProgress[q.id];
            if (p) {
                if (p.status === 'known') knownCount++;
                if (p.status === 'weak') weakCount++;
            }
        });

        return {
            weakCount,
            knownCount,
            totalQuestions
        };
    };

    return (
        <div className={styles.container}>
            {/* Action Bar (Top) */}
            <div className={styles.statsBar}>
                <div style={{ flex: 1 }}></div>

                <button className={styles.actionButton} onClick={() => alert('機能はまだ実装されていません')}>
                    <div className={styles.circleIcon}>
                        <Settings size={24} />
                    </div>
                    <span>設定</span>
                </button>

                <button className={styles.actionButton} onClick={logout}>
                    <div className={styles.circleIcon}>
                        <LogOut size={24} />
                    </div>
                    <span>ログアウト</span>
                </button>
            </div>

            {/* Course List as Folders */}
            <div className={styles.courseList}>
                {courses.map(course => {
                    const stats = getCourseStats(course);
                    const progressPercent = stats.totalQuestions > 0
                        ? Math.round((stats.knownCount / stats.totalQuestions) * 100)
                        : 0;

                    return (
                        <div
                            key={course.id}
                            className={styles.folderCard}
                            onClick={() => navigate(`/student/learn/${course.id}`)}
                        >
                            <div className={styles.folderIconArea}>
                                <Folder size={32} fill="currentColor" />
                            </div>

                            <div className={styles.cardContent}>
                                <h3 className={styles.cardTitle}>{course.title}</h3>
                                <div className={styles.cardStats}>
                                    <div className={styles.statItem}>
                                        <CheckSquare size={14} />
                                        <span>{stats.totalQuestions}</span>
                                    </div>
                                    <div className={styles.statItem}>
                                        <Clock size={14} />
                                        <span>未実装</span>
                                    </div>
                                    <div className={styles.statItem} style={{ color: 'var(--color-error)' }}>
                                        <AlertCircle size={14} />
                                        <span>{stats.weakCount}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.progressBadge}>
                                <CheckSquare size={18} fill={progressPercent === 100 ? "currentColor" : "none"} />
                                <span>{progressPercent}%</span>
                            </div>

                            <ChevronRight className={styles.arrowRight} />
                        </div>
                    );
                })}

                {courses.length === 0 && (
                    <div className={styles.emptyState}>
                        <p>現在利用可能なコースはありません。</p>
                        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>先生がコースを追加するのを待ちましょう。</p>
                    </div>
                )}
            </div>
        </div>
    );
};
