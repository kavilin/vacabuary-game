"use client";
import { useState, useEffect } from 'react';
import { playSuccessSound, playErrorSound, playWinSound } from '../utils/audio';
import Tile from './Tile';
import styles from './GameBoard.module.css';

export default function GameBoard() {
    const [tiles, setTiles] = useState([]);
    const [selectedTiles, setSelectedTiles] = useState([]);
    const [matchedIds, setMatchedIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isWon, setIsWon] = useState(false);

    useEffect(() => {
        startNewGame();
    }, []);

    const startNewGame = async () => {
        setLoading(true);
        setError(null);
        setIsWon(false);
        setMatchedIds([]);
        setSelectedTiles([]);

        try {
            const res = await fetch('/api/generate-game');
            const data = await res.json();

            if (data.error) {
                // Fallback data if API fails (e.g. no key)
                console.warn("API Error, using fallback data:", data.error);
                const fallbackItems = [
                    { id: '1', word: '蘋果', imageUrl: 'https://image.pollinations.ai/prompt/cartoon%20apple?width=300&nologo=true' },
                    { id: '2', word: '車', imageUrl: 'https://image.pollinations.ai/prompt/cartoon%20car?width=300&nologo=true' },
                    { id: '3', word: '貓', imageUrl: 'https://image.pollinations.ai/prompt/cartoon%20cat?width=300&nologo=true' },
                    { id: '4', word: '狗', imageUrl: 'https://image.pollinations.ai/prompt/cartoon%20dog?width=300&nologo=true' },
                ];
                setupBoard(fallbackItems);
                setLoading(false);
                return;
            }

            setupBoard(data.items);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const setupBoard = (items) => {
        const newTiles = [];
        items.forEach(item => {
            newTiles.push({ id: item.id, content: item.imageUrl, type: 'image', uniqueId: item.id + '-img' });
            newTiles.push({ id: item.word, content: item.word, type: 'text', uniqueId: item.id + '-txt', matchId: item.id });
        });
        // Fix: Ensure both have same matchId
        const fixedTiles = newTiles.map(t => ({ ...t, matchId: t.matchId || t.id }));

        setTiles(fixedTiles.sort(() => Math.random() - 0.5));
    };

    const handleTileClick = (tile) => {
        if (selectedTiles.length >= 2 || selectedTiles.includes(tile) || matchedIds.includes(tile.matchId)) return;

        const newSelected = [...selectedTiles, tile];
        setSelectedTiles(newSelected);

        if (newSelected.length === 2) {
            if (newSelected[0].matchId === newSelected[1].matchId) {
                // Match
                playSuccessSound();
                const newMatched = [...matchedIds, newSelected[0].matchId];
                setMatchedIds(newMatched);
                setSelectedTiles([]);

                // Check win
                if (newMatched.length === tiles.length / 2) {
                    playWinSound();
                    setTimeout(() => setIsWon(true), 500);
                }
            } else {
                // Mismatch
                playErrorSound();
                setTimeout(() => setSelectedTiles([]), 1000);
            }
        }
    };

    if (loading) return <div className={styles.loading}>Loading Game... 🎨</div>;
    if (error) return <div className={styles.error}>Error: {error} <button onClick={startNewGame}>Retry</button></div>;

    return (
        <div className={styles.container}>
            {isWon && (
                <div className={styles.overlay}>
                    <div className={styles.winModal}>
                        <h2>🎉 Amazing! 🎉</h2>
                        <button className={styles.restartBtn} onClick={startNewGame}>Play Again</button>
                    </div>
                </div>
            )}

            <div className={styles.grid}>
                {tiles.map(tile => (
                    <Tile
                        key={tile.uniqueId}
                        content={tile.content}
                        type={tile.type}
                        isSelected={selectedTiles.includes(tile)}
                        isMatched={matchedIds.includes(tile.matchId)}
                        isError={selectedTiles.length === 2 && selectedTiles.includes(tile) && selectedTiles[0].matchId !== selectedTiles[1].matchId}
                        onClick={() => handleTileClick(tile)}
                    />
                ))}
            </div>
        </div>
    );
}
