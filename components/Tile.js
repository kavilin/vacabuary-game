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
                <img src={content} alt="game item" className={styles.image} />
            ) : (
                <span className={styles.text}>{content}</span>
            )}
        </div>
    );
}
