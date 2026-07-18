import { motion } from 'framer-motion';
import { HUDPanel, Readout, ACCENT } from './ui/HUDPanel';

const GRADE_CONFIG = {
  A: { color: '#00E08A', bg: 'rgba(0,224,138,0.1)', border: 'rgba(0,224,138,0.5)', glow: '0 0 28px rgba(0,224,138,0.35)' },
  B: { color: '#4D9FFF', bg: 'rgba(77,159,255,0.1)', border: 'rgba(77,159,255,0.5)', glow: '0 0 28px rgba(77,159,255,0.25)' },
  C: { color: '#FFA31A', bg: 'rgba(255,163,26,0.1)', border: 'rgba(255,163,26,0.5)', glow: '0 0 28px rgba(255,163,26,0.25)' },
  D: { color: '#FF6B2C', bg: 'rgba(255,107,44,0.1)', border: 'rgba(255,107,44,0.5)', glow: '0 0 28px rgba(255,107,44,0.25)' },
  F: { color: '#FF3355', bg: 'rgba(255,51,85,0.1)', border: 'rgba(255,51,85,0.5)', glow: '0 0 28px rgba(255,51,85,0.35)' }
};

function ValidityBar({ cert }) {
  if (!cert) return null;
  const from = new Date(cert.validFrom);
  const to = new Date(cert.validTo);
  const now = new Date();
  const total = to - from;
  const elapsed = now - from;
  const pct = Math.max(0, Math.min(100, (elapsed / total) * 100));
  const barColor = cert.expired ? '#FF3355' : cert.expiringSoon ? '#FFA31A' : '#00E08A';

  return (
    <div className="space-y-1">
      <div className="flex justify-between gap-2 font-mono text-xs" style={{ color: '#6B8199' }}>
        <span>{from.toLocaleDateString()}</span>
        <span style={{ color: barColor }}>
          {cert.expired ? `Exp ${Math.abs(cert.daysRemaining)}d ago` : `${cert.daysRemaining}d left`}
        </span>
        <span>{to.toLocaleDateString()}</span>
      </div>
      <div className="telemetry-track telemetry-track--seg" style={{ height: 5, '--accent': barColor }}>
        <motion.div className="telemetry-fill" style={{ '--accent': barColor }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
      </div>
    </div>
  );
}

export function TLSCard({ tls }) {
  if (!tls) return null;
  if (!tls.available) return (
    <HUDPanel label="TLS Analysis" accent={ACCENT.red}>
      <div className="font-mono text-xs break-words" style={{ color: '#FF3355' }}>TLS unavailable: {tls.error || 'Could not connect'}</div>
    </HUDPanel>
  );

  const grade = tls.grade || 'F';
  const cfg = GRADE_CONFIG[grade] || GRADE_CONFIG.F;

  return (
    <HUDPanel label="TLS Analysis" meta={`GRADE ${grade}`} accent={cfg.color} delay={0.05}>
      <div className="flex items-start gap-3 sm:gap-4 mb-4">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center font-display font-bold text-3xl sm:text-4xl"
          style={{
            background: cfg.bg,
            border: `1px solid ${cfg.border}`,
            color: cfg.color,
            boxShadow: cfg.glow,
            clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)'
          }}
        >
          {grade}
        </motion.div>

        <div className="flex-1 min-w-0 space-y-1">
          <Readout label="Protocol" value={tls.protocol || 'Unknown'} color={tls.protocol === 'TLSv1.3' ? '#00E08A' : '#FFA31A'} />
          <Readout label="Cipher" value={tls.cipher?.name || 'Unknown'} />
          <Readout label="Key Size" value={tls.cipher?.bits ? `${tls.cipher.bits} bits` : 'Unknown'} />
          <Readout label="Trusted" value={tls.authorized ? '✓ Yes' : '✗ No'} color={tls.authorized ? '#00E08A' : '#FF3355'} />
        </div>
      </div>

      {tls.cert && (
        <div className="space-y-4">
          <div className="p-3 space-y-2" style={{ background: 'rgba(20,36,58,0.25)', border: '1px solid #14243A' }}>
            <div className="hud-sublabel">Certificate</div>
            <div className="space-y-1">
              <Readout label="Subject" value={tls.cert.subject} keyWidth="w-14 sm:w-16" />
              <Readout label="Issuer" value={tls.cert.issuer} keyWidth="w-14 sm:w-16" />
              {tls.cert.selfSigned && <span className="chip badge-fail">SELF-SIGNED</span>}
            </div>
            <ValidityBar cert={tls.cert} />
          </div>

          {tls.cert.san?.length > 0 && (
            <div>
              <div className="hud-sublabel mb-2">SANs · {tls.cert.san.length}</div>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto scrollable pr-1">
                {tls.cert.san.slice(0, 20).map((san, i) => (
                  <span key={i} className="chip" style={{ background: 'rgba(0,229,255,0.08)', color: '#00E5FF', borderColor: 'rgba(0,229,255,0.25)' }}>{san}</span>
                ))}
                {tls.cert.san.length > 20 && <span className="chip" style={{ color: '#6B8199', borderColor: '#14243A' }}>+{tls.cert.san.length - 20}</span>}
              </div>
            </div>
          )}

          {tls.findings?.length > 0 && (
            <div className="space-y-1">
              {tls.findings.map((f, i) => (
                <div key={i} className="flex items-start gap-2 font-mono text-xs p-2" style={{ background: 'rgba(255,51,85,0.05)', borderLeft: '2px solid #FF3355' }}>
                  <span style={{ color: '#FF3355' }} className="flex-shrink-0">⚠</span>
                  <span className="text-text-primary break-words min-w-0">{f.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </HUDPanel>
  );
}
