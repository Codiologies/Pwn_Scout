import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HUDPanel } from './ui/HUDPanel';

function CountUp({ target, duration = 1400 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return <>{val}</>;
}

function ThreatGauge({ score }) {
  const radius = 66;
  const strokeWidth = 7;
  const circumference = 2 * Math.PI * radius;
  const [animScore, setAnimScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimScore(score), 120);
    return () => clearTimeout(timer);
  }, [score]);

  const color = score >= 80 ? '#FF3355' : score >= 60 ? '#FF6B2C' : score >= 40 ? '#FFA31A' : '#00E08A';
  const offset = circumference - (animScore / 100) * circumference;

  const ticks = Array.from({ length: 40 }, (_, i) => {
    const a = (i / 40) * 2 * Math.PI - Math.PI / 2;
    const lit = i / 40 <= animScore / 100;
    const inner = 78;
    const outer = i % 5 === 0 ? 88 : 84;
    return {
      x1: 90 + Math.cos(a) * inner,
      y1: 90 + Math.sin(a) * inner,
      x2: 90 + Math.cos(a) * outer,
      y2: 90 + Math.sin(a) * outer,
      lit
    };
  });

  return (
    <div className="relative flex items-center justify-center w-[160px] h-[160px] sm:w-[180px] sm:h-[180px]">
      <svg viewBox="0 0 180 180" className="w-full h-full">
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke={t.lit ? color : '#1E3A5C'}
            strokeWidth={1.4}
            opacity={t.lit ? 0.9 : 0.4}
            style={{ transition: 'stroke 0.4s, opacity 0.4s' }}
          />
        ))}
        <g transform="rotate(-90 90 90)">
          <circle cx={90} cy={90} r={radius} fill="none" stroke="#14243A" strokeWidth={strokeWidth} />
          <circle
            cx={90} cy={90} r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeLinecap="butt"
            style={{
              strokeDashoffset: offset,
              transition: 'stroke-dashoffset 1.5s cubic-bezier(0.34, 1.4, 0.64, 1), stroke 0.4s',
              filter: `drop-shadow(0 0 6px ${color}90)`
            }}
          />
        </g>
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-mono font-bold count-num glow-red" style={{ fontSize: '2.4rem', color, lineHeight: 1 }}>
          <CountUp target={score} />
        </span>
        <span className="hud-sublabel mt-1" style={{ fontSize: '0.55rem' }}>THREAT INDEX</span>
      </div>
    </div>
  );
}

const CATEGORY_CONFIG = {
  Critical: { color: '#FF3355', bg: 'rgba(255,51,85,0.12)', border: 'rgba(255,51,85,0.4)' },
  High: { color: '#FF6B2C', bg: 'rgba(255,107,44,0.12)', border: 'rgba(255,107,44,0.4)' },
  Medium: { color: '#FFA31A', bg: 'rgba(255,163,26,0.12)', border: 'rgba(255,163,26,0.4)' },
  Low: { color: '#4D9FFF', bg: 'rgba(77,159,255,0.12)', border: 'rgba(77,159,255,0.4)' },
  Info: { color: '#6B8199', bg: 'rgba(107,129,153,0.12)', border: 'rgba(107,129,153,0.4)' }
};

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'info'];

export function RiskCard({ risk }) {
  const [expanded, setExpanded] = useState(null);
  if (!risk) return null;

  const cfg = CATEGORY_CONFIG[risk.category] || CATEGORY_CONFIG.Info;

  return (
    <HUDPanel
      label="Threat Assessment"
      meta={`${risk.total} findings`}
      accent={cfg.color}
      delay={0.1}
      actions={
        <span className="chip flex-shrink-0" style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
          {risk.category}
        </span>
      }
    >
      <div className="flex justify-center mb-4">
        <ThreatGauge score={risk.score} />
      </div>

      <div className="flex gap-1.5 flex-wrap justify-center mb-4">
        {SEVERITY_ORDER.map(sev => {
          const count = risk.counts?.[sev] || 0;
          if (count === 0) return null;
          const c = CATEGORY_CONFIG[sev.charAt(0).toUpperCase() + sev.slice(1)] || CATEGORY_CONFIG.Info;
          return (
            <div key={sev} className="chip" style={{ background: c.bg, color: c.color, borderColor: c.border }}>
              {count} {sev}
            </div>
          );
        })}
      </div>

      {risk.attackSurface?.vectors?.length > 0 && (
        <div className="mb-4 p-3" style={{ background: 'rgba(20,36,58,0.3)', border: '1px solid #14243A' }}>
          <div className="hud-sublabel mb-2">Attack Surface</div>
          {risk.attackSurface.vectors.map((v, i) => (
            <div key={i} className="font-mono text-xs text-text-primary flex items-start gap-2 mb-1">
              <span style={{ color: '#FF3355' }} className="flex-shrink-0">▸</span>
              <span className="break-words min-w-0">{v}</span>
            </div>
          ))}
        </div>
      )}

      {risk.findings?.length > 0 && (
        <div>
          <div className="hud-sublabel mb-2">Findings Log</div>
          <div className="space-y-1 max-h-72 scrollable pr-1">
            {risk.findings.slice(0, 10).map((f, i) => {
              const sev = f.severity?.toLowerCase();
              const c = CATEGORY_CONFIG[sev?.charAt(0).toUpperCase() + sev?.slice(1)] || CATEGORY_CONFIG.Info;
              const isOpen = expanded === i;
              return (
                <div
                  key={i}
                  className="cursor-pointer"
                  style={{ background: 'rgba(3,6,11,0.6)', borderLeft: `2px solid ${isOpen ? c.color : c.border}` }}
                  onClick={() => setExpanded(isOpen ? null : i)}
                >
                  <div className="flex items-center gap-2 px-2.5 py-2">
                    <span className="chip flex-shrink-0" style={{ background: c.bg, color: c.color, borderColor: c.border }}>
                      {f.severity?.toUpperCase()}
                    </span>
                    <span className="font-mono text-xs text-text-primary flex-1 truncate">{f.title}</span>
                    <span style={{ color: '#6B8199', fontSize: '0.6rem' }} className="flex-shrink-0">{isOpen ? '▲' : '▼'}</span>
                  </div>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden px-2.5 pb-2 space-y-1"
                      >
                        <p className="font-mono text-xs break-words" style={{ color: '#6B8199' }}>{f.detail}</p>
                        {f.remediation && (
                          <p className="font-mono text-xs break-words" style={{ color: '#00E08A' }}>▸ Fix: {f.remediation}</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </HUDPanel>
  );
}
