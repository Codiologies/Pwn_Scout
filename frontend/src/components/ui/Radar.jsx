import { useMemo } from 'react';
import { motion } from 'framer-motion';

/** Stable 32-bit hash so a given host always lands on the same bearing. */
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * Places real scan findings on a bearing/range plot.
 *
 * Bearing is hashed from each finding's name purely so the layout is stable
 * across renders — it carries no geographic meaning. Range IS meaningful:
 * higher-severity findings sit closer to the center.
 */
export function toBlips({ subdomains = [], openPorts = [], findings = [] }) {
  const blips = [];

  subdomains.slice(0, 28).forEach(s => {
    const name = s.subdomain || '';
    blips.push({
      id: `sub:${name}`,
      label: name,
      angle: hash(name) % 360,
      radius: 0.55 + (hash(name + 'r') % 40) / 100,
      color: '#4D9FFF',
      size: 4
    });
  });

  openPorts.slice(0, 20).forEach(p => {
    const key = `port:${p.port}`;
    blips.push({
      id: key,
      label: `${p.port} ${p.service || ''}`.trim(),
      angle: hash(key) % 360,
      radius: 0.3 + (hash(key + 'r') % 30) / 100,
      color: '#FFA31A',
      size: 5
    });
  });

  findings
    .filter(f => ['critical', 'high'].includes(f.severity?.toLowerCase()))
    .slice(0, 12)
    .forEach((f, i) => {
      const key = `find:${f.title || i}`;
      blips.push({
        id: key,
        label: f.title,
        angle: hash(key) % 360,
        radius: 0.12 + (hash(key + 'r') % 18) / 100,
        color: f.severity?.toLowerCase() === 'critical' ? '#FF3355' : '#FF6B2C',
        size: 6
      });
    });

  return blips;
}

/**
 * Fully fluid radar. `size` is any CSS length (e.g. "min(70vw, 240px)");
 * everything inside is percentage / viewBox based so it scales cleanly on
 * phones and desktops alike.
 */
export function Radar({ blips = [], active = false, size = 'min(72vw, 240px)', label = 'STANDBY' }) {
  const rings = [0.28, 0.55, 0.82, 1];

  // Blips in a 0..100 coordinate space, positioned via percentages.
  const placed = useMemo(
    () =>
      blips.map(b => {
        const rad = (b.angle * Math.PI) / 180;
        const r = b.radius * 50; // 0..50 of the 100-unit box
        return {
          ...b,
          x: 50 + Math.cos(rad) * r,
          y: 50 + Math.sin(rad) * r
        };
      }),
    [blips]
  );

  return (
    <div className="radar aspect-square" style={{ width: size }}>
      {/* Rings + graticule (viewBox scales to container) */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
        {rings.map((r, i) => (
          <circle
            key={i}
            cx={50}
            cy={50}
            r={r * 50 - 0.5}
            fill="none"
            stroke="#1E3A5C"
            strokeWidth={0.4}
            strokeDasharray={i === rings.length - 1 ? '0' : '1.5 2.5'}
            opacity={0.7}
          />
        ))}
        <line x1={50} y1={0} x2={50} y2={100} stroke="#1E3A5C" strokeWidth={0.4} opacity={0.5} />
        <line x1={0} y1={50} x2={100} y2={50} stroke="#1E3A5C" strokeWidth={0.4} opacity={0.5} />
        <line x1={15} y1={15} x2={85} y2={85} stroke="#1E3A5C" strokeWidth={0.4} opacity={0.22} />
        <line x1={85} y1={15} x2={15} y2={85} stroke="#1E3A5C" strokeWidth={0.4} opacity={0.22} />
        <circle cx={50} cy={50} r={1.2} fill="#00E5FF" />
      </svg>

      {/* Sweep */}
      {active && <div className="radar__sweep" />}

      {/* Blips */}
      {placed.map((b, i) => (
        <motion.span
          key={b.id}
          className="radar__blip"
          title={b.label}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: Math.min(i * 0.035, 1), type: 'spring', stiffness: 300, damping: 18 }}
          style={{
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: b.size,
            height: b.size,
            background: b.color,
            boxShadow: `0 0 8px ${b.color}`
          }}
        />
      ))}

      {/* Caption */}
      <div className="absolute inset-x-0 bottom-3 sm:bottom-4 flex justify-center pointer-events-none">
        <span
          className="hud-sublabel px-2 py-0.5"
          style={{
            background: 'rgba(3,6,11,0.75)',
            border: '1px solid #14243A',
            color: active ? '#00E5FF' : '#3E5266'
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
