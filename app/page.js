import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
    return (
        <main className={styles.main}>
            <h1 className={styles.title}>Connect the Dots 🍎</h1>
            <p className={styles.subtitle}>Choose your level:</p>

            <div className={styles.menu}>
                <Link href="/game?difficulty=easy" className={`${styles.btn} ${styles.easy}`}>
                    Easy 🐣
                    <span>(3 years old)</span>
                </Link>

                <Link href="/game?difficulty=medium" className={`${styles.btn} ${styles.medium}`}>
                    Medium 🦊
                    <span>(4-5 years old)</span>
                </Link>

                <Link href="/game?difficulty=hard" className={`${styles.btn} ${styles.hard}`}>
                    Hard 🦁
                    <span>(Expert)</span>
                </Link>
            </div>

            <div className={styles.divider}>或選擇遊戲模式</div>

            <div className={styles.menu}>
                <Link href="/matching" className={`${styles.btn} ${styles.matching}`}>
                    連連看遊戲 🎯
                    <span>(拖曳連線配對)</span>
                </Link>
            </div>
        </main>
    );
}
