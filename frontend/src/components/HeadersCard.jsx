import { useState } from 'react';
import { motion } from 'framer-motion';
import { HUDPanel, Telemetry, ACCENT } from './ui/HUDPanel';

const STATUS_ICON = { pass: '✓', warn: '◐', fail: '✗' };
const STATUS_CLASS = { pass: 'badge-pass', warn: 'badge-warn', fail: 'badge-fail' };

export function HeadersCard({ secHeaders }) {
  const [copied, setCopied] = useState(null);
  if (!secHeaders) return null;
  if (secHeaders.error) return (
    <HUDPanel label="Security Headers" accent={ACCENT.red}>
      <div className="font-mono text-xs break-words" style={{ color: '#FF3355' }}>{secHeaders.error}</div>
    </HUDPanel>
  );

  const copyConfig = (type) => {
    const cfg = secHeaders.remediationConfig?.[type];
    if (!cfg) return;
    navigator.clipboard.writeText(cfg).then(() => {
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const scoreColor = secHeaders.score >= 80 ? '#00E08A' : secHeaders.score >= 50 ? '#FFA31A' : '#FF3355';

  return (
    <HUDPanel
      label="Security Headers"
      accent={scoreColor}
      delay={0.1}
      actions={
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="font-mono text-xs font-bold count-num" style={{ color: scoreColor }}>{secHeaders.passed}/{secHeaders.total}</span>
          <div className="w-16 hidden sm:block"><Telemetry value={secHeaders.score} accent={scoreColor} /></div>
        </div>
      }
    >
      <div className="space-y-1.5 mb-4">
        {(secHeaders.results || []).map((h, i) => (
          <motion.div
            key={h.key}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(i * 0.04, 0.4) }}
            className="flex items-start gap-3 p-2.5"
            style={{ background: 'rgba(20,36,58,0.25)', borderLeft: `2px solid ${h.status === 'pass' ? '#00E08A' : h.status === 'warn' ? '#FFA31A' : '#FF3355'}` }}
          >
            <span className={`chip ${STATUS_CLASS[h.status]} flex-shrink-0 justify-center`} style={{ minWidth: '1.6rem' }}>{STATUS_ICON[h.status]}</span>
            <div className="flex-1 min-w-0">
              <div className="font-mono text-xs text-text-primary truncate">{h.name}</div>
              {h.value && h.status === 'pass' && <div className="font-mono text-xs truncate mt-0.5" style={{ color: '#6B8199' }}>{h.value}</div>}
              {h.status !== 'pass' && <div className="font-mono text-xs mt-0.5 break-words" style={{ color: '#6B8199' }}>{h.detail}</div>}
            </div>
          </motion.div>
        ))}
      </div>

      {secHeaders.remediationConfig && (
        <div className="space-y-2">
          <div className="hud-sublabel">Quick Fix Config</div>
          <div className="flex gap-2">
            {['nginx', 'apache'].map(type => (
              <button
                key={type}
                onClick={() => copyConfig(type)}
                className="hud-btn flex-1 py-2 text-xs"
                style={{ '--accent': copied === type ? '#00E08A' : '#6B8199', color: copied === type ? '#00E08A' : '#6B8199' }}
              >
                {copied === type ? '✓ COPIED' : `COPY ${type.toUpperCase()}`}
              </button>
            ))}
          </div>
        </div>
      )}
    </HUDPanel>
  );
}
