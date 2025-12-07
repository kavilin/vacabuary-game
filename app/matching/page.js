'use client';

import { Suspense } from 'react';
import MatchingGame from '../../components/MatchingGame';
import Link from 'next/link';

export default function MatchingGamePage() {
    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
                <Link href="/" style={{
                    color: 'white',
                    textDecoration: 'none',
                    fontSize: '18px',
                    display: 'inline-block',
                    marginBottom: '20px'
                }}>
                    ← 返回首頁
                </Link>

                <Suspense fallback={<div style={{ color: 'white', textAlign: 'center', padding: '50px' }}>載入中...</div>}>
                    <MatchingGame difficulty="easy" />
                </Suspense>
            </div>
        </div>
    );
}
