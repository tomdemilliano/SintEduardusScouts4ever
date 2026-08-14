import { colors } from '../lib/theme';

// Losse, organische decoraties die het "strakke" gevoel doorbreken: een tak
// met blaadjes in twee hoeken, en een ruwe verfstreep-achtige rand links en
// rechts. Alles fixed gepositioneerd, laag opaciteit, geen pointer-events —
// puur sfeer, nooit in de weg van de inhoud. Op smalle schermen (waar geen
// ruimte over is naast de content) worden ze verborgen via de meegeleverde
// <style> media query.

function Blad({ x, y, rotate, scale = 1, kleur }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <path
        d="M0 0 C 6 -10, 20 -12, 26 0 C 20 10, 6 10, 0 0 Z"
        fill={kleur}
      />
    </g>
  );
}

function TakHoek({ corner = 'top-left' }) {
  const flip = corner === 'top-right' || corner === 'bottom-right';
  const flipV = corner === 'bottom-left' || corner === 'bottom-right';
  const positie = {
    'top-left': { top: -10, left: -10 },
    'top-right': { top: -10, right: -10 },
    'bottom-left': { bottom: -10, left: -10 },
    'bottom-right': { bottom: -10, right: -10 },
  }[corner];

  return (
    <svg
      width="150"
      height="150"
      viewBox="0 0 150 150"
      style={{
        position: 'fixed',
        ...positie,
        transform: `scaleX(${flip ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
        opacity: 0.5,
        zIndex: 0,
      }}
    >
      <path
        d="M -5 -5 C 30 5, 55 25, 60 65 C 63 90, 80 100, 100 95"
        stroke={colors.forest}
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M 15 12 C 25 20, 35 30, 38 45"
        stroke={colors.forest}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        opacity="0.45"
      />
      <Blad x={18} y={8} rotate={-30} scale={0.8} kleur={colors.forest} />
      <Blad x={38} y={28} rotate={20} scale={0.65} kleur={colors.campfire} />
      <Blad x={30} y={45} rotate={-60} scale={0.7} kleur={colors.forest} />
      <Blad x={58} y={62} rotate={40} scale={0.85} kleur={colors.forest} />
      <Blad x={75} y={88} rotate={-15} scale={0.6} kleur={colors.campfire} />
    </svg>
  );
}

function VerfStreep({ side = 'left' }) {
  // Een ruwe, ongelijke verticale streep die aan een kwaststreek doet denken.
  const d =
    side === 'left'
      ? 'M 0 0 L 22 0 C 30 80, 8 160, 26 240 C 38 320, 4 400, 24 480 C 34 560, 6 640, 22 720 C 30 800, 8 880, 20 960 L 0 960 Z'
      : 'M 40 0 L 18 0 C 10 80, 32 160, 14 240 C 2 320, 36 400, 16 480 C 6 560, 34 640, 18 720 C 10 800, 32 880, 20 960 L 40 960 Z';

  return (
    <svg
      width="40"
      height="960"
      viewBox="0 0 40 960"
      preserveAspectRatio="none"
      className="vb-verfstreep"
      style={{
        position: 'fixed',
        top: 0,
        [side]: 0,
        height: '100vh',
        opacity: 0.35,
        zIndex: 0,
      }}
    >
      <path d={d} fill={side === 'left' ? colors.forest : colors.campfire} />
    </svg>
  );
}

export default function Decorations() {
  return (
    <>
      <style jsx global>{`
        @media (max-width: 1100px) {
          .vb-decoratie {
            display: none !important;
          }
        }
      `}</style>
      <div className="vb-decoratie">
        <TakHoek corner="top-left" />
        <TakHoek corner="bottom-right" />
        <VerfStreep side="left" />
        <VerfStreep side="right" />
      </div>
    </>
  );
}
