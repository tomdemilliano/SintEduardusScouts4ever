import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { login } from '../../lib/auth';
import { colors, fonts, fontImports, radius } from '../../lib/theme';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [wachtwoord, setWachtwoord] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleLogin = async () => {
    setBusy(true);
    setError(null);
    try {
      await login(email, wachtwoord);
      router.push('/beheer');
    } catch (err) {
      setError('Inloggen mislukt. Controleer e-mailadres en wachtwoord.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Head>
        <link rel="stylesheet" href={fontImports} />
        <title>Inloggen — Vriendenboekje beheer</title>
      </Head>

      <div
        style={{
          background: colors.paperCard,
          border: `1px solid ${colors.line}`,
          borderRadius: radius.card,
          padding: 32,
          width: 320,
        }}
      >
        <h1 style={{ fontFamily: fonts.display, fontSize: 24, fontWeight: 600, color: colors.ink, margin: '0 0 20px' }}>
          Beheer — inloggen
        </h1>

        <label style={{ display: 'block', fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted, marginBottom: 4 }}>
          E-mailadres
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        <label style={{ display: 'block', fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted, margin: '14px 0 4px' }}>
          Wachtwoord
        </label>
        <input
          type="password"
          value={wachtwoord}
          onChange={(e) => setWachtwoord(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          style={inputStyle}
        />

        {error && <p style={{ fontFamily: fonts.body, fontSize: 12, color: colors.stamp, marginTop: 10 }}>{error}</p>}

        <button
          onClick={handleLogin}
          disabled={busy}
          style={{
            marginTop: 20,
            width: '100%',
            padding: '10px 0',
            borderRadius: radius.badge,
            border: 'none',
            background: busy ? colors.inkMuted : colors.forest,
            color: colors.white,
            fontFamily: fonts.body,
            fontWeight: 600,
            fontSize: 14,
            cursor: busy ? 'default' : 'pointer',
          }}
        >
          {busy ? 'Bezig…' : 'Inloggen'}
        </button>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 3,
  border: `1px solid ${colors.line}`,
  background: colors.white,
  fontFamily: fonts.body,
  fontSize: 14,
  color: colors.ink,
  boxSizing: 'border-box',
};
