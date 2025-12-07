'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './MatchingGame.module.css';

const SNAP_DISTANCE = 40; // pixels for snap detection

export default function MatchingGame({ difficulty = 'easy' }) {
    const [gameItems, setGameItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [connections, setConnections] = useState([]);
    const [dragState, setDragState] = useState(null);
    const [score, setScore] = useState(0);
    const [gameComplete, setGameComplete] = useState(false);
    const [highlightedDots, setHighlightedDots] = useState({ image: null, word: null });
    const [matchedImages, setMatchedImages] = useState(new Set());
    const [matchedWords, setMatchedWords] = useState(new Set());
    const [fadingOutItems, setFadingOutItems] = useState({ images: new Set(), words: new Set() });
    const [lineUpdateTrigger, setLineUpdateTrigger] = useState(0);
    const svgRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        fetchGameData();
    }, [difficulty]);

    const fetchGameData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/generate-game?difficulty=${difficulty}&mode=matching`);
            const data = await response.json();

            // Shuffle words separately from images
            const items = data.items || [];
            const shuffledWords = [...items].sort(() => Math.random() - 0.5);

            setGameItems(items.map((item, idx) => ({
                ...item,
                shuffledWord: shuffledWords[idx].word,
                shuffledId: shuffledWords[idx].id
            })));
            setConnections([]);
            setScore(0);
            setGameComplete(false);
            setMatchedImages(new Set());
            setMatchedWords(new Set());
            setFadingOutItems({ images: new Set(), words: new Set() });
        } catch (error) {
            console.error('Error fetching game data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getElementCenter = (element) => {
        if (!element || !svgRef.current) return null;

        const rect = element.getBoundingClientRect();
        const viewportX = rect.left + (rect.width / 2);
        const viewportY = rect.top + (rect.height / 2);

        const svg = svgRef.current;
        const point = svg.createSVGPoint();
        point.x = viewportX;
        point.y = viewportY;

        const ctm = svg.getScreenCTM();
        if (!ctm) return null;

        const svgPoint = point.matrixTransform(ctm.inverse());
        return { x: svgPoint.x, y: svgPoint.y };
    };

    const findNearestDot = (x, y, type) => {
        const dots = document.querySelectorAll(`.${type}-dot`);
        let nearest = null;
        let minDistance = SNAP_DISTANCE;

        dots.forEach((dot) => {
            const index = parseInt(dot.getAttribute('data-index'));

            // Skip matched items based on type
            if (type === 'image' && matchedImages.has(index)) return;
            if (type === 'word' && matchedWords.has(index)) return;

            const center = getElementCenter(dot);
            if (!center) return;

            const distance = Math.sqrt(
                Math.pow(center.x - x, 2) + Math.pow(center.y - y, 2)
            );

            if (distance < minDistance) {
                minDistance = distance;
                nearest = { index, center, element: dot };
            }
        });

        return nearest;
    };

    const handleDragStart = (e, index, type) => {
        e.preventDefault();
        const dot = e.currentTarget;
        const center = getElementCenter(dot);

        if (!center) return;

        const coords = {
            startIndex: index,
            startType: type,
            startPos: center,
            currentPos: center
        };

        setDragState(coords);
    };

    const handleDragMove = (e) => {
        if (!dragState || !svgRef.current) return;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        // Convert viewport coordinates to SVG coordinates
        const svg = svgRef.current;
        const point = svg.createSVGPoint();
        point.x = clientX;
        point.y = clientY;

        const ctm = svg.getScreenCTM();
        if (!ctm) return;

        const svgPoint = point.matrixTransform(ctm.inverse());
        const x = svgPoint.x;
        const y = svgPoint.y;

        // Check for nearby dots to snap
        const targetType = dragState.startType === 'image' ? 'word' : 'image';
        const nearest = findNearestDot(x, y, targetType);

        // Update highlighted dots
        if (nearest) {
            setHighlightedDots({
                image: dragState.startType === 'image' ? dragState.startIndex : nearest.index,
                word: dragState.startType === 'word' ? dragState.startIndex : nearest.index
            });
        } else {
            setHighlightedDots({ image: null, word: null });
        }

        setDragState(prev => {
            const updatedState = {
                ...prev,
                currentPos: nearest ? nearest.center : { x, y },
                nearestDot: nearest
            };
            return updatedState;
        });
    };

    const handleDragEnd = () => {
        if (!dragState) return;

        if (dragState.nearestDot) {
            const imageIndex = dragState.startType === 'image'
                ? dragState.startIndex
                : dragState.nearestDot.index;
            const wordIndex = dragState.startType === 'word'
                ? dragState.startIndex
                : dragState.nearestDot.index;

            // Check if already connected
            const existingConnection = connections.find(
                c => c.imageIndex === imageIndex || c.wordIndex === wordIndex
            );

            if (!existingConnection) {
                const isCorrect = gameItems[imageIndex].id === gameItems[wordIndex].shuffledId;

                const newConnection = {
                    imageIndex,
                    wordIndex,
                    correct: isCorrect,
                    fadeOut: false
                };

                setConnections(prev => [...prev, newConnection]);

                // If correct, remove cards after animation
                if (isCorrect) {
                    setScore(prev => prev + 1);

                    setTimeout(() => {
                        setConnections(prev =>
                            prev.map(c =>
                                c.imageIndex === imageIndex && c.wordIndex === wordIndex
                                    ? { ...c, fadeOut: true }
                                    : c
                            )
                        );

                        // Start fade-out animation for cards
                        setFadingOutItems(prev => ({
                            images: new Set(prev.images).add(imageIndex),
                            words: new Set(prev.words).add(wordIndex)
                        }));

                        // Remove cards after fade animation (800ms)
                        setTimeout(() => {
                            setMatchedImages(prev => {
                                const newSet = new Set(prev);
                                newSet.add(imageIndex);
                                return newSet;
                            });

                            setMatchedWords(prev => {
                                const newSet = new Set(prev);
                                newSet.add(wordIndex);
                                return newSet;
                            });

                            setConnections(prev =>
                                prev.filter(c =>
                                    !(c.imageIndex === imageIndex && c.wordIndex === wordIndex)
                                )
                            );

                            // Force line re-render after cards are removed
                            setTimeout(() => {
                                setLineUpdateTrigger(prev => prev + 1);
                            }, 100);

                            // Check if game is complete
                            setMatchedImages(currentMatchedImages => {
                                if (currentMatchedImages.size >= gameItems.length) {
                                    setGameComplete(true);
                                }
                                return currentMatchedImages;
                            });
                        }, 1000);
                    }, 500);
                } else {
                    // Wrong connection - remove after 2 seconds
                    setTimeout(() => {
                        setConnections(prev =>
                            prev.filter(c =>
                                !(c.imageIndex === imageIndex && c.wordIndex === wordIndex)
                            )
                        );
                    }, 2000);
                }
            }
        }

        setDragState(null);
        setHighlightedDots({ image: null, word: null });
    };

    const resetGame = () => {
        fetchGameData();
    };

    if (loading) {
        return <div className={styles.loading}>載入中...</div>;
    }

    return (
        <div className={styles.container} ref={containerRef}>
            <div className={styles.header}>
                <h2>連連看遊戲</h2>
                <div className={styles.score}>
                    正確: {score} 題
                </div>
            </div>

            <div
                className={styles.gameArea}
                onMouseMove={handleDragMove}
                onMouseUp={handleDragEnd}
                onTouchMove={handleDragMove}
                onTouchEnd={handleDragEnd}
            >
                {/* Images Column */}
                <div className={styles.imagesColumn}>
                    {gameItems.map((item, index) => {
                        if (matchedImages.has(index)) return null;
                        const isFadingOut = fadingOutItems.images.has(index);
                        return (
                            <div
                                key={`img-${index}`}
                                className={`${styles.imageCard} ${isFadingOut ? styles.fadeOutCard : ''}`}
                            >
                                <img src={item.imageUrl} alt={item.word} />
                                <div
                                    className={`${styles.dot} ${styles.imageDot} image-dot ${highlightedDots.image === index ? styles.highlighted : ''
                                        }`}
                                    data-index={index}
                                    onMouseDown={(e) => handleDragStart(e, index, 'image')}
                                    onTouchStart={(e) => handleDragStart(e, index, 'image')}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* SVG for drawing lines */}
                <svg ref={svgRef} className={styles.linesSvg} key={lineUpdateTrigger}>
                    {/* Existing connections */}
                    {connections.map((conn, idx) => {
                        const imageDot = document.querySelector(`.image-dot[data-index="${conn.imageIndex}"]`);
                        const wordDot = document.querySelector(`.word-dot[data-index="${conn.wordIndex}"]`);

                        if (!imageDot || !wordDot) return null;

                        const start = getElementCenter(imageDot);
                        const end = getElementCenter(wordDot);

                        if (!start || !end) return null;

                        return (
                            <line
                                key={`line-${idx}`}
                                x1={start.x}
                                y1={start.y}
                                x2={end.x}
                                y2={end.y}
                                className={`${conn.correct ? styles.correctLine : styles.incorrectLine} ${conn.fadeOut ? styles.fadeOut : ''}`}
                                strokeWidth="3"
                            />
                        );
                    })}

                    {/* Current drag line */}
                    {dragState && dragState.startPos && (
                        <line
                            x1={dragState.startPos.x}
                            y1={dragState.startPos.y}
                            x2={dragState.currentPos.x}
                            y2={dragState.currentPos.y}
                            className={styles.dragLine}
                            strokeWidth="3"
                            strokeDasharray="5,5"
                        />
                    )}
                </svg>

                {/* Words Column */}
                <div className={styles.wordsColumn}>
                    {gameItems.map((item, index) => {
                        if (matchedWords.has(index)) return null;
                        const isFadingOut = fadingOutItems.words.has(index);
                        return (
                            <div
                                key={`word-${index}`}
                                className={`${styles.wordCard} ${isFadingOut ? styles.fadeOutCard : ''}`}
                            >
                                <div
                                    className={`${styles.dot} ${styles.wordDot} word-dot ${highlightedDots.word === index ? styles.highlighted : ''
                                        }`}
                                    data-index={index}
                                    onMouseDown={(e) => handleDragStart(e, index, 'word')}
                                    onTouchStart={(e) => handleDragStart(e, index, 'word')}
                                />
                                <span className={styles.wordText}>{item.shuffledWord}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {gameComplete && (
                <div className={styles.gameComplete}>
                    <h3>遊戲完成！</h3>
                    <p>你答對了 {score} 題！</p>
                    <button onClick={resetGame} className={styles.resetButton}>
                        再玩一次
                    </button>
                </div>
            )}
        </div>
    );
}
