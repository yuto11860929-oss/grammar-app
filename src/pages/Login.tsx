import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { BookOpen, User as UserIcon } from 'lucide-react';
import { type UserRole } from '../types';

export const Login: React.FC = () => {
    const { login, user } = useAuth();
    const [role, setRole] = useState<UserRole | null>(null);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    if (user) {
        if (user.role === 'teacher') return <Navigate to="/teacher" />;
        return <Navigate to="/student" />;
    }

    const handleLogin = () => {
        setError('');
        const success = login(username, password);
        if (!success) {
            setError('IDまたはパスワードが正しくありません');
        }
    };

    // Role Selection View
    if (!role) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem' }}>
                <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>GrammarPro</h1>
                    <Card>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <Button onClick={() => setRole('teacher')} size="lg" fullWidth style={{ justifyContent: 'center', gap: '0.5rem' }}>
                                <BookOpen size={20} /> 先生としてログイン
                            </Button>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--color-text-muted)' }}>
                                <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
                                または
                                <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
                            </div>
                            <Button onClick={() => setRole('student')} variant="secondary" size="lg" fullWidth style={{ justifyContent: 'center', gap: '0.5rem' }}>
                                <UserIcon size={20} /> 生徒としてログイン
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    // Credentials Form View
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem' }}>
            <div style={{ width: '100%', maxWidth: '400px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>{role === 'teacher' ? '先生ログイン' : '生徒ログイン'}</h1>
                </div>

                <Card>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                        <Input
                            label="ユーザー名 / ID"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            fullWidth
                        />
                        <Input
                            label="パスワード"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            fullWidth
                        />
                        {error && <span style={{ color: 'var(--color-error)' }}>{error}</span>}
                    </div>

                    <Button onClick={handleLogin} fullWidth size="lg">ログイン</Button>

                    <Button
                        onClick={() => { setRole(null); setError(''); setUsername(''); setPassword(''); }}
                        variant="ghost"
                        fullWidth
                        style={{ marginTop: '0.5rem' }}
                    >
                        戻る
                    </Button>
                </Card>

                {role === 'teacher' && (
                    <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                        初期アカウント: <b>teacher</b> / <b>password</b>
                    </p>
                )}
            </div>
        </div>
    );
};
