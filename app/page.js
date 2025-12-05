import GameBoard from '../components/GameBoard';
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Connect the Dots 🍎</h1>
      <GameBoard />
    </main>
  );
}
