import React, { useState, useEffect } from 'react';
import { Plus, Trash2, User as UserIcon } from 'lucide-react';
import { storage } from '../../utils/storage';
import { type User } from '../../types';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import styles from './StudentManagement.module.css';

// Simple random ID generator
const generateId = () => Math.random().toString(36).substring(2, 9);

export const StudentManagement: React.FC = () => {
    const [students, setStudents] = useState<User[]>([]);
    const [isCreating, setIsCreating] = useState(false);

    // New user form state
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newName, setNewName] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = () => {
        const allUsers = storage.getUsers();
        setStudents(allUsers.filter(u => u.role === 'student'));
    };

    const handleCreate = () => {
        setError('');
        if (!newUsername || !newPassword || !newName) {
            setError('すべての項目を入力してください');
            return;
        }

        const allUsers = storage.getUsers();
        if (allUsers.some(u => u.username === newUsername)) {
            setError('このユーザーIDは既に使用されています');
            return;
        }

        const newUser: User = {
            id: generateId(),
            username: newUsername,
            password: newPassword,
            name: newName,
            role: 'student'
        };

        allUsers.push(newUser);
        storage.saveUsers(allUsers);

        // Reset form
        setNewUsername('');
        setNewPassword('');
        setNewName('');
        setIsCreating(false);
        loadStudents();
    };

    const handleDelete = (id: string) => {
        if (confirm('本当に削除しますか？この操作により、生徒アカウントは削除されますが、現在のバージョンでは学習データは保持される場合があります。')) {
            const allUsers = storage.getUsers();
            const updatedUsers = allUsers.filter(u => u.id !== id);
            storage.saveUsers(updatedUsers);
            loadStudents();
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>生徒管理</h1>
                <Button onClick={() => setIsCreating(!isCreating)}>
                    <Plus size={18} style={{ marginRight: '0.5rem' }} />
                    {isCreating ? 'キャンセル' : '生徒を追加'}
                </Button>
            </header>

            {isCreating && (
                <Card className={styles.createCard}>
                    <h3>新規生徒アカウント作成</h3>
                    <div className={styles.formGrid}>
                        <Input
                            label="ユーザー名 (ID)"
                            value={newUsername}
                            onChange={e => setNewUsername(e.target.value)}
                            placeholder="例: student01"
                        />
                        <Input
                            label="パスワード"
                            type="text"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="例: pass123"
                        />
                        <Input
                            label="表示名 (氏名)"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            placeholder="例: 山田 太郎"
                        />
                    </div>
                    {error && <p className={styles.error}>{error}</p>}
                    <Button onClick={handleCreate} fullWidth style={{ marginTop: '1rem' }}>
                        アカウント作成
                    </Button>
                </Card>
            )}

            <div className={styles.list}>
                {students.length === 0 ? (
                    <p className={styles.empty}>生徒が登録されていません。</p>
                ) : (
                    students.map(student => (
                        <Card key={student.id} className={styles.studentRow}>
                            <div className={styles.studentInfo}>
                                <div className={styles.avatar}>
                                    <UserIcon size={24} />
                                </div>
                                <div>
                                    <div className={styles.name}>{student.name}</div>
                                    <div className={styles.meta}>ID: {student.username} | Pass: {student.password}</div>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(student.id)} style={{ color: 'var(--color-error)' }}>
                                <Trash2 size={18} />
                            </Button>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};
