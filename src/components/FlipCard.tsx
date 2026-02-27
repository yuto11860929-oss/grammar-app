import React, { type ReactNode } from 'react';
import styles from './FlipCard.module.css';

interface FlipCardProps {
    frontContent: ReactNode;
    backContent: ReactNode;
    isFlipped: boolean;
    onFlip: () => void;
    className?: string;
}

export const FlipCard: React.FC<FlipCardProps> = ({ frontContent, backContent, isFlipped, onFlip, className = '' }) => {
    return (
        <div className={`${styles.cardContainer} ${className}`} onClick={onFlip}>
            <div className={`${styles.cardInner} ${isFlipped ? styles.flipped : ""}`}>
                <div className={styles.cardFront}>
                    {frontContent}
                </div>
                <div className={styles.cardBack}>
                    {backContent}
                </div>
            </div>
        </div>
    );
};
