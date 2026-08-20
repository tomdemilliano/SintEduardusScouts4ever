import { useEffect, useState } from 'react';
import { PhotoTagFactory } from '../lib/dbSchema';
import { colors, fonts, radius } from '../lib/theme';

/**
 * value: array van tag-ID's. Toont enkel tags die de beheerder heeft
 * aangemaakt — hier kan geen nieuwe, vrije tag getypt worden (dat is
 * bewust beheerder-only, zie /beheer/fotos/tags).
 */
export default function PhotoTagSelector({ value, onChange }) {
  const [alleTags, setAlleTags] = useState([]);

  useEffect(() => {
    PhotoTagFactory.getAll().then(setAlleTags);
  }, []);

  const geselecteerd = value || [];

  const toggle = (id) => {
    if (geselecteerd.includes(id)) onChange(geselecteerd.filter((t) => t !== id));
    else onChange([...geselecteerd, id]);
  };

  if (alleTags.length === 0) {
    return (
      <p style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted, margin: 0 }}>
        Nog geen tags aangemaakt.
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {alleTags.map((tag) => {
        const actief = geselecteerd.includes(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggle(tag.id)}
            style={{
              padding: '5px 12px',
              borderRadius: radius.badge,
              border: `1.5px solid ${actief ? colors.forest : colors.line}`,
              background: actief ? colors.forest : colors.white,
              color: actief ? colors.white : colors.ink,
              fontFamily: fonts.body,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {tag.naam}
          </button>
        );
      })}
    </div>
  );
}
