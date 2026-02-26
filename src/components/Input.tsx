import React from 'react';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    fullWidth = false,
    className = '',
    ...props
}) => {
    return (
        <div className={`${styles.wrapper} ${fullWidth ? styles.fullWidth : ''} ${className}`}>
            {label && <label className={styles.label}>{label}</label>}
            <input
                className={`${styles.input} ${error ? styles.hasError : ''}`}
                {...props}
            />
            {error && <span className={styles.errorText}>{error}</span>}
        </div>
    );
};

export const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string; fullWidth?: boolean }> = ({
    label,
    error,
    fullWidth = false,
    className = '',
    ...props
}) => {
    return (
        <div className={`${styles.wrapper} ${fullWidth ? styles.fullWidth : ''} ${className}`}>
            {label && <label className={styles.label}>{label}</label>}
            <textarea
                className={`${styles.input} ${styles.textarea} ${error ? styles.hasError : ''}`}
                {...props}
            />
            {error && <span className={styles.errorText}>{error}</span>}
        </div>
    );
};
