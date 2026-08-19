import { useEffect, useState } from 'react';
import { EntryFactory } from '../lib/dbSchema';
import { colors, fonts, radius } from '../lib/theme';

/**
 * value: array van { naam, entryId } — entryId is null voor vrij getypte
 * namen die niet overeenkomen met een bestaand vriendenboekje-lid.
 */
export default function MemberTagPicker({ value, onChange }) {
  const [alleLeden, setAlleLeden] = useState([]);
  const [zoekterm, setZoekterm] = useState('');

  useEffect(() => {
    EntryFactory.getPublished().then(setAlleLeden);
  }, []);

  const tags = value || [];

  const suggesties = zoekterm.trim()
    ? alleLeden
        .filter((e) => e.naam?.toLowerCase().includes(zoekterm.trim().toLowerCase()))
        .filter((e) => !tags.some((t) => t.entryId === e.id))
        .slice(0, 6)
    : [];

  const voegToe = (naam, entryId) => {
    if (tags.some((t) => t.naam.toLowerCase() === naam.toLowerCase())) return;
    onChange([...tags, { naam, entryId: entryId || null }]);
    setZoekterm('');
  };

  const verwijder = (index) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: tags.length ? 8 : 0 }}>
        {tags.map((tag, i) => (
          <span
            key={i}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: radius.badge,
              background: colors.campfireLight,
              fontFamily: fonts.body,
              fontSize: 12,
              fontWeight: 600,
              color: colors.ink,
            }}
          >
            {tag.naam}
            <button
              type="button"
              onClick={() => verwijder(i)}
              aria-label={`${tag.naam} verwijderen`}
              style={{ background: 'none', border: 'none', color: colors.stamp, cursor: 'pointer', fontSize: 12, padding: 0 }}
            >
              ✕
            </button>
          </span>
        ))}
      </div>

      <input
        type="text"
        value={zoekterm}
        onChange={(e) => setZoekterm(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && zoekterm.trim()) {
            e.preventDefault();
            voegToe(zoekterm.trim(), null);
          }
        }}
        placeholder="Typ een naam en kies uit de lijst, of druk Enter voor een vrije naam"
        style={{
          width: '100%',
          padding: '9px 12px',
          borderRadius: radius.input,
          border: `1px solid ${colors.line}`,
          background: colors.white,
          fontFamily: fonts.body,
          fontSize: 14,
          color: colors.ink,
          boxSizing: 'border-box',
        }}
      />

      {suggesties.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
          {suggesties.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => voegToe(e.naam, e.id)}
              style={{
                padding: '5px 12px',
                borderRadius: radius.badge,
                border: `1px solid ${colors.line}`,
                background: colors.white,
                fontFamily: fonts.body,
                fontSize: 12,
                color: colors.ink,
                cursor: 'pointer',
              }}
            >
              + {e.naam}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
