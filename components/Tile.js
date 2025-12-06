import Image from 'next/image';
import styles from './Tile.module.css';

export default function Tile({ content, type, isSelected, isMatched, isError, onClick }) {
    return (
        <div
            className={`
        ${styles.tile} 
        ${isSelected ? styles.selected : ''} 
        ${isMatched ? styles.matched : ''}
        ${isError ? styles.error : ''}
      `}
            onClick={() => !isMatched && onClick()}
        >
            {type === 'image' ? (
                <div className={styles.imageWrapper}>
                    <Image
                        src={content}
                        alt="game item"
                        fill
                        sizes="(max-width: 600px) 100px, 140px"
                        className={styles.image}
                        priority={true} // Load eagerly to avoid pop-in
                    />
                </div>
            ) : (
                <span className={styles.text}>{content}</span>
            )}
        </div>
    );
}
