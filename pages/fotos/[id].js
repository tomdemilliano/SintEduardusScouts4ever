import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { PhotoFactory, PhotoTagFactory, ActivityFactory } from '../../lib/dbSchema';
import { colors, fonts, fontImports, radius } from '../../lib/theme';
import { rotateImageFile, decenniumLabel } from '../../lib/utils';
import PublicNav from '../../components/PublicNav';
import MemberTagPicker from '../../components/MemberTagPicker';
import PhotoTagSelector from '../../components/PhotoTagSelector';

const DECENNIA = [1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];

export default function FotoDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [foto, setFoto] = useState(null);
  const [alleTags, setAlleTags] = useState([]);
  const [alleFotos, setAlleFotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [afbeeldingFout, setAfbeeldingFout] = useState(false);

  const [bewerkModus, setBewerkModus] = useState(false);
  const [volledigScherm, setVolledigScherm] = useState(false);
  const [toonGetagdOverlay, setToonGetagdOverlay] = useState(false);
  const [jaar, setJaar] = useState('');
  const [decennium, setDecennium] = useState('');
  const [locatie, setLocatie] = useState('');
  const [beschrijving, setBeschrijving] = useState('');
  const [ledenTags, setLedenTags] = useState([]);
  const [tagIds, setTagIds] = useState([]);
  const [opslaanBezig, setOpslaanBezig] = useState(false);
  const [roterenBezig, setRoterenBezig] = useState(false);

  const [verwijderReden, setVerwijderReden] = useState('');
  const [verwijderBezig, setVerwijderBezig] = useState(false);
  const [verwijderVerzonden, setVerwijderVerzonden] = useState(false);

  useEffect(() => {
    // De bezoeker kwam mogelijk van het overzicht met een filter actief —
    // gebruik dan exact diezelfde, gefilterde volgorde voor vorige/volgende
    // i.p.v. gewoon alle gepubliceerde foto's te doorlopen.
    let opgeslagenVolgorde = null;
    if (typeof window !== 'undefined') {
      try {
        const raw = sessionStorage.getItem('vb-fotos-volgorde');
        if (raw) opgeslagenVolgorde = JSON.parse(raw);
      } catch (e) {
        opgeslagenVolgorde = null;
      }
    }

    if (Array.isArray(opgeslagenVolgorde) && opgeslagenVolgorde.length > 0) {
      setAlleFotos(opgeslagenVolgorde.map((fid) => ({ id: fid })));
    } else {
      PhotoFactory.getPublished().then((lijst) => {
        lijst.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setAlleFotos(lijst);
      });
    }
    PhotoTagFactory.getAll().then(setAlleTags);
  }, []);

  useEffect(() => {
    if (!id) return;
    setAfbeeldingFout(false);
    setBewerkModus(false);
    PhotoFactory.getById(id).then((f) => {
      const geldig = f && f.status === 'published';
      setFoto(geldig ? f : null);
      setLoading(false);
    });
  }, [id]);

  const huidigeIndex = alleFotos.findIndex((f) => f.id === id);
  const vorigeFoto = huidigeIndex > 0 ? alleFotos[huidigeIndex - 1] : null;
  const volgendeFoto = huidigeIndex >= 0 && huidigeIndex < alleFotos.length - 1 ? alleFotos[huidigeIndex + 1] : null;

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowLeft' && vorigeFoto) router.push(`/fotos/${vorigeFoto.id}`);
      if (e.key === 'ArrowRight' && volgendeFoto) router.push(`/fotos/${volgendeFoto.id}`);
      if (e.key === 'Escape' && volledigScherm) setVolledigScherm(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [vorigeFoto, volgendeFoto, router, volledigScherm]);

  const startBewerken = () => {
    setJaar(foto.jaar ? String(foto.jaar) : '');
    setDecennium(foto.decennium != null ? String(foto.decennium) : '');
    setLocatie(foto.locatie || '');
    setBeschrijving(foto.beschrijving || '');
    setLedenTags(foto.ledenTags || []);
    setTagIds(foto.tagIds || []);
    setBewerkModus(true);
  };

  const draaien = async () => {
    setRoterenBezig(true);
    try {
      const bestand = await rotateImageFile(foto.afbeeldingUrl, 90);
      const upload = await PhotoFactory.replaceImage(id, bestand, foto.afbeeldingPath);
      setFoto((prev) => ({ ...prev, afbeeldingUrl: upload.url, afbeeldingPath: upload.path }));
      ActivityFactory.log({ type: 'foto', actie: 'Foto gedraaid', itemId: id, omschrijving: 'Een bezoeker draaide een foto 90°.', afbeeldingUrl: upload.url });
    } catch (err) {
      alert('Draaien is mislukt, probeer opnieuw.');
      console.error('Fout bij het draaien van de foto:', err);
    } finally {
      setRoterenBezig(false);
    }
  };

  const opslaan = async () => {
    setOpslaanBezig(true);
    try {
      const decenniumWaarde = decennium ? parseInt(decennium, 10) : null;
      await PhotoFactory.updateTags(id, {
        jaar: jaar ? parseInt(jaar, 10) : null,
        decennium: decenniumWaarde,
        locatie: locatie.trim(),
        beschrijving: beschrijving.trim(),
        ledenTags,
        tagIds,
      });
      setFoto((prev) => ({
        ...prev,
        jaar: jaar ? parseInt(jaar, 10) : null,
        decennium: decenniumWaarde,
        locatie: locatie.trim(),
        beschrijving: beschrijving.trim(),
        ledenTags,
        tagIds,
      }));
      setBewerkModus(false);
      ActivityFactory.log({
        type: 'foto',
        actie: 'Foto-gegevens bijgewerkt',
        itemId: id,
        omschrijving: `Jaar/locatie/leden/categorie aangepast door een bezoeker.`,
        afbeeldingUrl: foto.afbeeldingUrl,
      });
    } finally {
      setOpslaanBezig(false);
    }
  };

  const vraagVerwijdering = async () => {
    setVerwijderBezig(true);
    try {
      await PhotoFactory.requestDelete(id, verwijderReden.trim());
      setVerwijderVerzonden(true);
      ActivityFactory.log({
        type: 'foto',
        actie: 'Verwijdering aangevraagd',
        itemId: id,
        omschrijving: verwijderReden.trim() ? `Reden: "${verwijderReden.trim()}"` : 'Geen reden opgegeven.',
        afbeeldingUrl: foto.afbeeldingUrl,
      });
    } finally {
      setVerwijderBezig(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'transparent', padding: 48 }}>
        <p style={{ fontFamily: fonts.body, color: colors.inkMuted }}>Bezig met laden…</p>
      </div>
    );
  }

  if (!foto) {
    return (
      <div style={{ minHeight: '100vh', background: 'transparent', padding: 48, textAlign: 'center' }}>
        <p style={{ fontFamily: fonts.body, color: colors.stamp, marginBottom: 12 }}>
          Deze foto bestaat niet (meer) of is nog niet gepubliceerd.
        </p>
        <Link href="/fotos" style={{ fontFamily: fonts.body, color: colors.forest }}>
          ← Terug naar de foto's
        </Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Head>
        <link rel="stylesheet" href={fontImports} />
        <title>Foto — Vrienden van Sint-Eduardusscouts</title>
      </Head>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 20px 100px' }}>
        <PublicNav />

        <Link href="/fotos" style={{ display: 'inline-block', margin: '20px 0', fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted, textDecoration: 'none' }}>
          ← Terug naar de foto's
        </Link>

        <div style={{ background: colors.paperCard, border: `1px solid ${colors.line}`, borderRadius: radius.card, overflow: 'hidden', marginBottom: 12, position: 'relative' }}>
          {afbeeldingFout ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🖼️</div>
              <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted, marginBottom: 12 }}>
                Deze afbeelding kan hier niet getoond worden.
              </p>
              <a href={foto.afbeeldingUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.forest }}>
                Bekijk de originele link →
              </a>
            </div>
          ) : (
            <img src={foto.afbeeldingUrl} alt="" onError={() => setAfbeeldingFout(true)} style={{ width: '100%', display: 'block' }} />
          )}

          {!afbeeldingFout && (
            <button
              onClick={() => setVolledigScherm(true)}
              aria-label="Volledig scherm"
              title="Volledig scherm"
              style={{
                position: 'absolute',
                bottom: 10,
                right: 10,
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'rgba(44, 36, 25, 0.55)',
                color: colors.white,
                border: 'none',
                fontSize: 16,
                cursor: 'pointer',
              }}
            >
              ⛶
            </button>
          )}

          {vorigeFoto && (
            <Link
              href={`/fotos/${vorigeFoto.id}`}
              aria-label="Vorige foto"
              style={navPijlStyle('left')}
            >
              ‹
            </Link>
          )}
          {volgendeFoto && (
            <Link
              href={`/fotos/${volgendeFoto.id}`}
              aria-label="Volgende foto"
              style={navPijlStyle('right')}
            >
              ›
            </Link>
          )}
        </div>

        {alleFotos.length > 0 && huidigeIndex >= 0 && (
          <p style={{ textAlign: 'center', fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted, margin: '0 0 20px' }}>
            Foto {huidigeIndex + 1} van {alleFotos.length}
          </p>
        )}

        {volledigScherm && (
          <VolledigSchermOverlay
            foto={foto}
            alleTags={alleTags}
            vorigeFoto={vorigeFoto}
            volgendeFoto={volgendeFoto}
            toonGetagdOverlay={toonGetagdOverlay}
            setToonGetagdOverlay={setToonGetagdOverlay}
            onSluiten={() => {
              setVolledigScherm(false);
              setToonGetagdOverlay(false);
            }}
            onNavigeer={(nieuwId) => {
              setToonGetagdOverlay(false);
              router.push(`/fotos/${nieuwId}`);
            }}
          />
        )}

        {verwijderVerzonden ? (
          <div style={{ background: colors.campfireLight, border: `1.5px solid ${colors.campfire}`, borderRadius: radius.card, padding: '16px 18px', marginBottom: 20 }}>
            <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink, margin: 0 }}>
              ✓ Je verwijderverzoek is verstuurd. De beheerder bekijkt het nog even.
            </p>
          </div>
        ) : (
          <>
            {!bewerkModus ? (
              <div style={{ background: colors.paperCard, border: `1px solid ${colors.line}`, borderRadius: radius.card, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                <LeesVeld label="Jaar" waarde={foto.jaar || (foto.decennium != null ? decenniumLabel(foto.decennium) : '')} />
                <LeesVeld label="Locatie" waarde={foto.locatie} />
                <LeesVeld label="Wie staat erop?" waarde={(foto.ledenTags || []).map((t) => t.naam).join(', ')} />
                <LeesVeld
                  label="Categorie"
                  waarde={(foto.tagIds || [])
                    .map((tid) => alleTags.find((t) => t.id === tid)?.naam)
                    .filter(Boolean)
                    .join(', ')}
                />
                <LeesVeld label="Extra info" waarde={foto.beschrijving} />

                <button
                  onClick={startBewerken}
                  style={{
                    alignSelf: 'flex-start',
                    marginTop: 6,
                    padding: '9px 20px',
                    borderRadius: radius.badge,
                    border: 'none',
                    background: colors.forest,
                    color: colors.white,
                    fontFamily: fonts.body,
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  ✏️ Bewerken
                </button>
                <p style={{ fontFamily: fonts.body, fontSize: 11, color: colors.inkMuted, margin: 0 }}>
                  Klik op "Bewerken" om jaar, locatie, wie erop staat, categorie of extra info aan te vullen of te corrigeren.
                </p>
              </div>
            ) : (
              <div style={{ background: colors.paperCard, border: `1.5px solid ${colors.forest}`, borderRadius: radius.card, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
                <div>
                  <Label>Foto verkeerd georiënteerd?</Label>
                  <button
                    onClick={draaien}
                    disabled={roterenBezig}
                    style={{
                      padding: '8px 16px',
                      borderRadius: radius.badge,
                      border: `1px solid ${colors.line}`,
                      background: colors.white,
                      color: colors.ink,
                      fontFamily: fonts.body,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: roterenBezig ? 'default' : 'pointer',
                    }}
                  >
                    {roterenBezig ? 'Bezig met draaien…' : '↻ 90° draaien'}
                  </button>
                </div>

                <div>
                  <Label>Jaar (indien gekend)</Label>
                  <input
                    type="number"
                    value={jaar}
                    onChange={(e) => setJaar(e.target.value)}
                    placeholder="bv. 1978"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <Label>Decennium (als je het exacte jaar niet weet)</Label>
                  <select value={decennium} onChange={(e) => setDecennium(e.target.value)} style={inputStyle}>
                    <option value="">— geen —</option>
                    {DECENNIA.map((d) => (
                      <option key={d} value={d}>
                        {decenniumLabel(d)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Locatie</Label>
                  <input
                    type="text"
                    value={locatie}
                    onChange={(e) => setLocatie(e.target.value)}
                    placeholder="bv. Falmignoul (Walzin)"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <Label>Wie staat erop?</Label>
                  <MemberTagPicker value={ledenTags} onChange={setLedenTags} />
                </div>
                <div>
                  <Label>Categorie (optioneel)</Label>
                  <PhotoTagSelector value={tagIds} onChange={setTagIds} />
                </div>
                <div>
                  <Label>Extra info (optioneel)</Label>
                  <textarea
                    value={beschrijving}
                    onChange={(e) => setBeschrijving(e.target.value)}
                    placeholder="bv. wat er op de foto te zien is, een leuke anekdote…"
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    onClick={opslaan}
                    disabled={opslaanBezig}
                    style={{
                      padding: '10px 22px',
                      borderRadius: radius.badge,
                      border: 'none',
                      background: opslaanBezig ? colors.inkMuted : colors.forest,
                      color: colors.white,
                      fontFamily: fonts.body,
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: opslaanBezig ? 'default' : 'pointer',
                    }}
                  >
                    {opslaanBezig ? 'Bezig…' : 'Opslaan'}
                  </button>
                  <button
                    onClick={() => setBewerkModus(false)}
                    style={{
                      padding: '10px 22px',
                      borderRadius: radius.badge,
                      border: `1px solid ${colors.line}`,
                      background: 'transparent',
                      color: colors.inkMuted,
                      fontFamily: fonts.body,
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    Annuleren
                  </button>
                </div>
                <p style={{ fontFamily: fonts.body, fontSize: 11, color: colors.inkMuted, margin: 0 }}>
                  Iedereen kan deze gegevens aanvullen of corrigeren — zo helpen we samen de foto's te sorteren.
                </p>
              </div>
            )}

            <details>
              <summary style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted, cursor: 'pointer' }}>
                Hoort deze foto hier niet thuis? Vraag verwijdering aan
              </summary>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <textarea
                  value={verwijderReden}
                  onChange={(e) => setVerwijderReden(e.target.value)}
                  placeholder="Reden (optioneel)"
                  rows={2}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
                <button
                  onClick={vraagVerwijdering}
                  disabled={verwijderBezig}
                  style={{
                    alignSelf: 'flex-start',
                    padding: '8px 16px',
                    borderRadius: radius.badge,
                    border: 'none',
                    background: colors.stamp,
                    color: colors.white,
                    fontFamily: fonts.body,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: verwijderBezig ? 'default' : 'pointer',
                  }}
                >
                  {verwijderBezig ? 'Bezig…' : 'Verwijdering aanvragen'}
                </button>
              </div>
            </details>
          </>
        )}
      </div>
    </div>
  );
}

function LeesVeld({ label, waarde }) {
  return (
    <div>
      <div
        style={{
          fontFamily: fonts.body,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: colors.forest,
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div style={{ fontFamily: fonts.body, fontSize: 15, color: waarde ? colors.ink : colors.inkMuted }}>
        {waarde || '—'}
      </div>
    </div>
  );
}

function Label({ children }) {
  return (
    <label
      style={{
        display: 'block',
        fontFamily: fonts.body,
        fontSize: 12,
        fontWeight: 600,
        color: colors.inkMuted,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        marginBottom: 4,
      }}
    >
      {children}
    </label>
  );
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: radius.input,
  border: `1px solid ${colors.line}`,
  background: colors.white,
  fontFamily: fonts.body,
  fontSize: 14,
  color: colors.ink,
  boxSizing: 'border-box',
};

function VolledigSchermOverlay({ foto, alleTags, vorigeFoto, volgendeFoto, toonGetagdOverlay, setToonGetagdOverlay, onSluiten, onNavigeer }) {
  const [fout, setFout] = useState(false);
  const tagNamen = (foto.tagIds || [])
    .map((tid) => alleTags.find((t) => t.id === tid)?.naam)
    .filter(Boolean);
  const jaarTekst = foto.jaar ? String(foto.jaar) : foto.decennium != null ? decenniumLabel(foto.decennium) : 'jaartal onbekend';
  const aantalGetagd = (foto.ledenTags || []).length;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(20, 16, 10, 0.96)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={(e) => {
        // enkel sluiten bij een klik op de donkere achtergrond zelf, niet op de foto/iconen
        if (e.target === e.currentTarget) onSluiten();
      }}
    >
      {fout ? (
        <div style={{ textAlign: 'center', color: colors.white, fontFamily: fonts.body }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🖼️</div>
          <p>Deze afbeelding kan hier niet getoond worden.</p>
        </div>
      ) : (
        <img
          src={foto.afbeeldingUrl}
          alt=""
          onError={() => setFout(true)}
          style={{ maxWidth: '94vw', maxHeight: '94vh', objectFit: 'contain', display: 'block' }}
        />
      )}

      {/* Icoontjes rechtsboven */}
      <div style={{ position: 'fixed', top: 16, right: 16, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        {foto.locatie && (
          <div style={overlayIconStyle()}>
            <span style={{ fontSize: 15 }}>📍</span>
            <span style={{ fontFamily: fonts.body, fontSize: 11, color: colors.white, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {foto.locatie}
            </span>
          </div>
        )}

        {aantalGetagd > 0 && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setToonGetagdOverlay((v) => !v)}
              style={{ ...overlayIconStyle(), border: 'none', cursor: 'pointer' }}
              aria-label="Wie staat erop?"
            >
              <span style={{ fontSize: 15 }}>👥</span>
              <span
                style={{
                  fontFamily: fonts.body,
                  fontSize: 10,
                  fontWeight: 700,
                  color: colors.ink,
                  background: colors.campfire,
                  borderRadius: 999,
                  minWidth: 16,
                  height: 16,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                }}
              >
                {aantalGetagd}
              </span>
            </button>
            {toonGetagdOverlay && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  background: colors.white,
                  borderRadius: radius.card,
                  padding: '10px 14px',
                  minWidth: 150,
                  boxShadow: '0 6px 18px rgba(0,0,0,0.4)',
                }}
              >
                {(foto.ledenTags || []).map((t, i) => (
                  <div key={i} style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ink, padding: '3px 0' }}>
                    {t.naam}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={overlayIconStyle()}>
          <span style={{ fontSize: 13 }}>🗓️</span>
          <span style={{ fontFamily: fonts.body, fontSize: 11, color: colors.white, whiteSpace: 'nowrap' }}>{jaarTekst}</span>
        </div>

        <button
          onClick={onSluiten}
          aria-label="Volledig scherm sluiten"
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            color: colors.white,
            fontSize: 16,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      </div>

      {/* Vorige/volgende */}
      {vorigeFoto && (
        <button onClick={() => onNavigeer(vorigeFoto.id)} aria-label="Vorige foto" style={overlayNavPijlStyle('left')}>
          ‹
        </button>
      )}
      {volgendeFoto && (
        <button onClick={() => onNavigeer(volgendeFoto.id)} aria-label="Volgende foto" style={overlayNavPijlStyle('right')}>
          ›
        </button>
      )}
    </div>
  );
}

function overlayIconStyle() {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '6px 10px',
    borderRadius: 999,
    background: 'rgba(0, 0, 0, 0.5)',
  };
}

function overlayNavPijlStyle(kant) {
  return {
    position: 'fixed',
    top: '50%',
    [kant]: 16,
    transform: 'translateY(-50%)',
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.15)',
    border: 'none',
    color: colors.white,
    fontSize: 28,
    lineHeight: '48px',
    textAlign: 'center',
    cursor: 'pointer',
    fontFamily: fonts.body,
    fontWeight: 700,
  };
}

function navPijlStyle(kant) {
  return {
    position: 'absolute',
    top: '50%',
    [kant]: 10,
    transform: 'translateY(-50%)',
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: 'rgba(44, 36, 25, 0.55)',
    color: colors.white,
    fontSize: 24,
    lineHeight: '40px',
    textAlign: 'center',
    textDecoration: 'none',
    fontFamily: fonts.body,
    fontWeight: 700,
  };
}
