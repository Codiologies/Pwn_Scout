import { motion } from 'framer-motion';

export const ACCENT = {
  cyan: '#00E5FF',
  amber: '#FFA31A',
  lime: '#00E08A',
  red: '#FF3355',
  orange: '#FF6B2C',
  blue: '#4D9FFF'
};

function Brackets() {
  return (
    <>
      <span className="hud-panel__bracket hud-panel__bracket--tl" />
      <span className="hud-panel__bracket hud-panel__bracket--tr" />
      <span className="hud-panel__bracket hud-panel__bracket--bl" />
      <span className="hud-panel__bracket hud-panel__bracket--br" />
    </>
  );
}

/**
 * A console module: clipped corners, bracket marks, label rail, accent LED.
 * `accent` drives the --accent custom property the whole panel theme reads.
 */
export function HUDPanel({
  label,
  meta,
  accent = ACCENT.cyan,
  delay = 0,
  className = '',
  bodyClassName = '',
  actions,
  children
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`hud-panel ${className}`}
      style={{ '--accent': accent }}
    >
      <Brackets />

      {label && (
        <header className="hud-panel__bar">
          <span className="hud-panel__led" />
          <h3 className="hud-label truncate">{label}</h3>
          <span className="hud-panel__rule" />
          {meta && <span className="hud-sublabel flex-shrink-0 hidden xs:block">{meta}</span>}
          {actions}
        </header>
      )}

      <div className={`hud-panel__body ${bodyClassName}`}>{children}</div>
    </motion.section>
  );
}

/** Small labelled key/value readout used across the data panels. */
export function Readout({ label, value, color, keyWidth = 'w-20 sm:w-24' }) {
  return (
    <div className="readout">
      <span className={`readout__key ${keyWidth}`}>{label}</span>
      <span className="text-xs flex-1 truncate font-mono" style={{ color: color || 'var(--txt)' }}>
        {value}
      </span>
    </div>
  );
}

/** Horizontal HUD meter. */
export function Telemetry({ value, accent = ACCENT.cyan, segmented = true, height = 4 }) {
  return (
    <div
      className={`telemetry-track ${segmented ? 'telemetry-track--seg' : ''}`}
      style={{ '--accent': accent, height }}
    >
      <motion.div
        className="telemetry-fill"
        style={{ '--accent': accent }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

/** Status LED with optional pulse. */
export function LED({ color = ACCENT.lime, pulse = false, size = 6 }) {
  return (
    <span
      className={`inline-block rounded-full flex-shrink-0 ${pulse ? 'animate-pulse' : ''}`}
      style={{
        width: size,
        height: size,
        background: color,
        boxShadow: `0 0 6px ${color}, 0 0 12px ${color}80`
      }}
    />
  );
}
