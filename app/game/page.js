import { Suspense } from 'react';
import GameBoard from '../../components/GameBoard';
import styles from "./page.module.css";

export default function Game() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Connect the Dots 🍎</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <GameBoard />
      </Suspense>
    </main>
  );
}
