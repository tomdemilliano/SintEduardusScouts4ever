import { useState } from 'react';
import { colors, fonts, radius } from '../lib/theme';
import { toDishArray, fileToBase64 } from '../lib/utils';
import DishListEditor from './DishListEditor';

const FIELVELDEN = [
  { key: 'naam', label: 'Naam', placeholder: 'Voornaam Achternaam' },
  { key: 'geboortejaar', label: 'Geboortejaar', placeholder: '19..' },
  { key: 'totemnaam', label: 'Totemnaam', placeholder: '' },
  { key: 'periode', label: 'Lid in periode', placeholder: '1952 - 1955' },
  { key: 'leuksteActiviteit', label: 'Plezantste spel / strafste activiteit', placeholder: '', multiline: true },
  { key: 'besteKampplaats', label: 'Beste kampplaats ooit', placeholder: '', multiline: true },
];

const empty = {
  naam: '',
  geboortejaar: '',
  totemnaam: '',
  periode: '',
  leuksteActiviteit: '',
  besteKampplaats: '',
  lekkersteEten: [''],
};

export default function EntryForm({
  initialValues,
  initialScanUrl,
  onSave, // (fields, file|null) => Promise
  saveLabel = 'Opslaan als concept',
}) {
  const [fields, setFields] = useState(() => ({
    ...(initialValues || empty),
    lekkersteEten: toDishArray((initialValues || empty).lekkersteEten),
  }));
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(initialScanUrl || null);
  const [recognizing, setRecognizing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError(null);
    if (f.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(f));
    } else {
      setPreviewUrl(null); // pdf: geen inline preview, wel herkenning mogelijk
    }
  };

  const handleRecognize = async () => {
    if (!file) return;
    setRecognizing(true);
    setError(null);
    try {
      const base64Data = await fileToBase64(file);
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Data, mimeType: file.type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Herkenning mislukt');
      setFields((prev) => ({
        ...prev,
        ...data,
        lekkersteEten: toDishArray(data.lekkersteEten),
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setRecognizing(false);
    }
  };

  const handleChange = (key, value) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const opgeschoond = {
        ...fields,
        lekkersteEten: fields.lekkersteEten.map((g) => g.trim()).filter(Boolean),
      };
      await onSave(opgeschoond, file);
    } catch (err) {
      setError(err.message || 'Opslaan mislukt');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Scan uploaden */}
      <div
        style={{
          border: `1.5px dashed ${colors.line}`,
          borderRadius: radius.card,
          padding: 20,
          background: colors.paperCard,
        }}
      >
        <label
          style={{
            display: 'inline-block',
            fontFamily: fonts.body,
            fontSize: 13,
            fontWeight: 600,
            color: colors.forestDark,
            marginBottom: 10,
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          Scan kiezen (foto of pdf)
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFile}
            style={{ display: 'block', marginTop: 8, fontFamily: fonts.body, fontSize: 14 }}
          />
        </label>

        {previewUrl && (
          <img
            src={previewUrl}
            alt="scan preview"
            style={{ maxWidth: '100%', maxHeight: 320, borderRadius: radius.card, marginTop: 12, border: `1px solid ${colors.line}` }}
          />
        )}
        {file && !previewUrl && (
          <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted, marginTop: 8 }}>
            📄 {file.name}
          </p>
        )}

        {file && (
          <button
            onClick={handleRecognize}
            disabled={recognizing}
            style={{
              marginTop: 14,
              padding: '10px 18px',
              borderRadius: radius.badge,
              border: 'none',
              background: recognizing ? colors.inkMuted : colors.campfire,
              color: colors.white,
              fontFamily: fonts.body,
              fontWeight: 600,
              fontSize: 13,
              cursor: recognizing ? 'default' : 'pointer',
            }}
          >
            {recognizing ? 'Bezig met herkennen…' : 'Tekst herkennen'}
          </button>
        )}
      </div>

      {error && (
        <div style={{ color: colors.stamp, fontFamily: fonts.body, fontSize: 13 }}>{error}</div>
      )}

      {/* Velden */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {FIELVELDEN.map((f) => (
          <div key={f.key}>
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
              {f.label}
            </label>
            {f.multiline ? (
              <textarea
                value={fields[f.key]}
                placeholder={f.placeholder}
                onChange={(e) => handleChange(f.key, e.target.value)}
                rows={2}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: radius.input,
                  border: `1px solid ${colors.line}`,
                  background: colors.white,
                  fontFamily: fonts.body,
                  fontSize: 14,
                  color: colors.ink,
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            ) : (
              <input
                type="text"
                value={fields[f.key]}
                placeholder={f.placeholder}
                onChange={(e) => handleChange(f.key, e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: radius.input,
                  border: `1px solid ${colors.line}`,
                  background: colors.white,
                  fontFamily: fonts.body,
                  fontSize: 14,
                  color: colors.ink,
                  boxSizing: 'border-box',
                }}
              />
            )}
          </div>
        ))}

        <div>
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
            Lekkerste kamp-eten
          </label>
          <DishListEditor
            value={fields.lekkersteEten}
            onChange={(lijst) => handleChange('lekkersteEten', lijst)}
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          alignSelf: 'flex-start',
          padding: '12px 24px',
          borderRadius: radius.badge,
          border: 'none',
          background: saving ? colors.inkMuted : colors.forest,
          color: colors.white,
          fontFamily: fonts.body,
          fontWeight: 600,
          fontSize: 14,
          cursor: saving ? 'default' : 'pointer',
        }}
      >
        {saving ? 'Bezig met opslaan…' : saveLabel}
      </button>
    </div>
  );
}
