import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { watchAuth, logout } from '../lib/auth';
import { colors, fonts } from '../lib/theme';
import AdminNav from './AdminNav';

export default function RequireAuth({ children }) {
  const router = useRouter();
  const [status, setStatus] = useState('loading'); // loading | ok | none

  useEffect(() => {
    const unsub = watchAuth((user) => {
      if (user) {
        setStatus('ok');
      } else {
        setStatus('none');
        if (router.pathname !== '/beheer/login') {
          router.replace('/beheer/login');
        }
      }
    });
    return () => unsub();
  }, [router]);

  if (status !== 'ok') {
    return (
      <div style={{ minHeight: '100vh', background: colors.paper, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: fonts.body, color: colors.inkMuted }}>Bezig met controleren…</p>
      </div>
    );
  }

  return (
    <>
      <div style={{ background: colors.forestDark, padding: '6px 20px', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={() => logout()}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.65)',
            fontFamily: fonts.body,
            fontSize: 11,
            cursor: 'pointer',
          }}
        >
          Uitloggen
        </button>
      </div>
      <AdminNav />
      {children}
    </>
  );
}
