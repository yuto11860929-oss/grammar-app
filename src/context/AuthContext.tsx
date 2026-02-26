import { createContext, useContext, useState, useEffect } from 'react';
import { type User } from '../types';
import { storage } from '../utils/storage';

interface AuthContextType {
    user: User | null;
    login: (username: string, password?: string) => boolean;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        // Check local storage for persisted session
        const savedUser = localStorage.getItem('grammar_app_user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
    }, []);

    const login = (username: string, password?: string): boolean => {
        const userFound = storage.getUserByUsername(username);

        if (userFound) {
            // Simple password check (plain text for prototype)
            if (userFound.password && userFound.password !== password) {
                return false;
            }
            setUser(userFound);
            localStorage.setItem('grammar_app_user', JSON.stringify(userFound));
            return true;
        }
        return false;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('grammar_app_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
