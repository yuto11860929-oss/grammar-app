import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, FileText, Clock } from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { storage } from '../../utils/storage';
import { type Course } from '../../types';
import styles from './Dashboard.module.css';

export const TeacherDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState<Course[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newTitle, setNewTitle] = useState('');

    useEffect(() => {
        setCourses(storage.getCourses());
    }, []);

    const handleDelete = (id: string) => {
        if (confirm('本当にこのコースを削除しますか？生徒の学習進捗データも削除される可能性があります。')) {
            const updated = courses.filter(c => c.id !== id);
            storage.saveCourses(updated);
            setCourses(updated);
        }
    };

    const handleCreate = () => {
        if (newTitle.trim()) {
            const newCourse: Course = {
                id: crypto.randomUUID(),
                title: newTitle.trim(),
                questions: [],
                createdAt: Date.now(),
            };
            const updatedCourses = [...courses, newCourse];
            storage.saveCourses(updatedCourses);
            setCourses(updatedCourses);
            setNewTitle('');
            setIsCreating(false);
            navigate(`/teacher/courses/${newCourse.id}`);
        }
    };

    const formatDate = (date: number | string) => {
        return new Date(date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>コース管理</h1>
                    <p className={styles.subtitle}>学習コンテンツの作成と管理</p>
                </div>
                <Button onClick={() => setIsCreating(true)}>
                    <Plus size={20} style={{ marginRight: '0.5rem' }} />
                    新規コース作成
                </Button>
            </header>

            {isCreating && (
                <Card className={styles.createCard}>
                    <div className={styles.createForm}>
                        <Input
                            label="コースタイトル"
                            placeholder="例: 英文法 第1章"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            fullWidth
                        />
                        <div className={styles.createActions}>
                            <Button variant="ghost" onClick={() => setIsCreating(false)}>キャンセル</Button>
                            <Button onClick={handleCreate}>作成して編集へ進む</Button>
                        </div>
                    </div>
                </Card>
            )}

            <div className={styles.grid}>
                {courses.map(course => (
                    <Card key={course.id} className={styles.courseCard}>
                        <div className={styles.cardHeader}>
                            <h3 className={styles.courseTitle}>{course.title}</h3>
                            <div className={styles.menuTrigger}>
                                <button onClick={() => handleDelete(course.id)} className={styles.iconBtn}>
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div className={styles.cardBody}>
                            <div className={styles.stat}>
                                <FileText size={16} />
                                <span>{course.questions.length} 問</span>
                            </div>
                            <div className={styles.stat}>
                                <Clock size={16} />
                                <span>作成日: {formatDate(course.createdAt)}</span>
                            </div>
                        </div>

                        <div className={styles.cardFooter}>
                            <Button variant="secondary" fullWidth onClick={() => navigate(`/teacher/courses/${course.id}`)}>
                                <Edit size={16} style={{ marginRight: '0.5rem' }} />
                                編集
                            </Button>
                        </div>
                    </Card>
                ))}

                {courses.length === 0 && !isCreating && (
                    <div className={styles.emptyState}>
                        <p>コースがまだありません。「新規コース作成」から始めましょう。</p>
                    </div>
                )}
            </div>
        </div>
    );
};
