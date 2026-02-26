import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, BookOpen, BarChart2, Home as HomeIcon, User } from 'lucide-react';
import styles from './Layout.module.css';

export const Layout: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // If not logged in, just render outlet (AuthGuard will handle protection)
    // Or we can assume Layout is only for authenticated pages.
    // Ideally, Login page shouldn't use this Layout.
    if (!user) return <Outlet />;

    const isTeacher = user.role === 'teacher';

    return (
        <div className={styles.layout}>
            <header className={styles.header}>
                <div className={styles.logo}>
                    <BookOpen size={24} className={styles.logoIcon} />
                    <span className={styles.logoText}>GrammarPro</span>
                </div>

                <nav className={styles.nav}>
                    {isTeacher ? (
                        <>
                            <NavLink to="/teacher" active={location.pathname === '/teacher' || location.pathname.startsWith('/teacher/courses')} icon={<BookOpen size={18} />}>
                                コース管理
                            </NavLink>
                            <NavLink to="/teacher/analytics" active={location.pathname === '/teacher/analytics'} icon={<BarChart2 size={18} />}>
                                分析
                            </NavLink>
                            <NavLink to="/teacher/students" active={location.pathname === '/teacher/students'} icon={<User size={18} />}>
                                生徒管理
                            </NavLink>
                            <NavLink to="/teacher/vocab" active={location.pathname === '/teacher/vocab'} icon={<BookOpen size={18} />}>
                                単語管理
                            </NavLink>
                        </>
                    ) : (
                        <>
                            <NavLink to="/student" active={location.pathname === '/student'} icon={<HomeIcon size={18} />}>
                                マイページ
                            </NavLink>
                            <NavLink to="/student/vocab" active={location.pathname === '/student/vocab'} icon={<BookOpen size={18} />}>
                                単語学習
                            </NavLink>
                        </>
                    )}
                </nav>

                <div className={styles.user}>
                    <span className={styles.userName}>{user.name}</span>
                    <button onClick={handleLogout} className={styles.logoutBtn} aria-label="Logout">
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            <main className={styles.main}>
                <Outlet />
            </main>
        </div>
    );
};

const NavLink = ({ to, active, children, icon }: any) => (
    <Link to={to} className={`${styles.navLink} ${active ? styles.active : ''}`}>
        {icon}
        <span>{children}</span>
    </Link>
);
