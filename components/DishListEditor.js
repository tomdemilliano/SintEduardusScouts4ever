import { colors, fonts, radius } from '../lib/theme';

export default function DishListEditor({ value, onChange }) {
  const gerechten = value.length ? value : [''];

  const update = (index, tekst) => {
    const next = [...gerechten];
    next[index] = tekst;
    onChange(next);
  };

  const verwijder = (index) => {
    const next = gerechten.filter((_, i) => i !== index);
    onChange(next.length ? next : ['']);
  };

  const voegToe = () => {
    onChange([...gerechten, '']);
  };

  const voegSamenMetVorige = (index) => {
    if (index === 0) return;
    const next = [...gerechten];
    const samengevoegd = `${next[index - 1]} ${next[index]}`.trim();
    next[index - 1] = samengevoegd;
    next.splice(index, 1);
    onChange(next);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {gerechten.map((gerecht, index) => (
        <div key={index} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            type="text"
            value={gerecht}
            placeholder="bv. Stoemp met worst"
            onChange={(e) => update(index, e.target.value)}
            style={{
              flex: 1,
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
          {index > 0 && (
            <button
              type="button"
              onClick={() => voegSamenMetVorige(index)}
              title="Samenvoegen met vorig gerecht"
              style={iconBtn(colors.forest)}
            >
              ⬆
            </button>
          )}
          {gerechten.length > 1 && (
            <button
              type="button"
              onClick={() => verwijder(index)}
              title="Verwijderen"
              style={iconBtn(colors.stamp)}
            >
              ✕
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={voegToe}
        style={{
          alignSelf: 'flex-start',
          padding: '6px 14px',
          borderRadius: radius.badge,
          border: `1px dashed ${colors.line}`,
          background: 'transparent',
          color: colors.inkMuted,
          fontFamily: fonts.body,
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        + Gerecht toevoegen
      </button>
    </div>
  );
}

function iconBtn(color) {
  return {
    flexShrink: 0,
    width: 30,
    height: 30,
    borderRadius: '50%',
    border: 'none',
    background: color,
    color: '#FFF',
    fontSize: 13,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
}
