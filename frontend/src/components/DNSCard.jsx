import { useState } from 'react';
import { motion } from 'framer-motion';
import { HUDPanel, ACCENT } from './ui/HUDPanel';

const INTERESTING_KEYWORDS = ['admin','login','dev','staging','test','backup','internal','jenkins','git','jira','vpn','secure'];

function Badge({ ok, label }) {
  return <span className={`chip ${ok ? 'badge-pass' : 'badge-fail'}`}>{ok ? '✓' : '✗'} {label}</span>;
}

function RecordRow({ type, records, delay }) {
  if (!records) return null;
  const arr = Array.isArray(records) ? records : [records];
  if (arr.length === 0) return null;
  const flat = arr.flatMap(r => (Array.isArray(r) ? r : [r]));
  if (flat.length === 0) return null;

  const display = (r) => (typeof r === 'object' && r !== null ? JSON.stringify(r) : String(r));

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex items-start gap-3 py-1.5 border-b font-mono text-xs"
      style={{ borderColor: '#14243A' }}
    >
      <span className="flex-shrink-0 w-11 font-semibold" style={{ color: '#00E5FF' }}>{type}</span>
      <div className="flex-1 space-y-0.5 min-w-0">
        {flat.slice(0, 5).map((r, i) => (
          <div key={i} className="text-text-primary break-all">{display(r)}</div>
        ))}
        {flat.length > 5 && <div style={{ color: '#6B8199' }}>+{flat.length - 5} more</div>}
      </div>
    </motion.div>
  );
}

export function DNSCard({ dns }) {
  const [showAll, setShowAll] = useState(false);
  if (!dns) return null;
  if (dns.error) return (
    <HUDPanel label="DNS Recon" accent={ACCENT.red}>
      <div className="font-mono text-xs break-words" style={{ color: '#FF3355' }}>DNS Error: {dns.error}</div>
    </HUDPanel>
  );

  const subdomains = dns.subdomains || [];
  const interesting = subdomains.filter(s => INTERESTING_KEYWORDS.some(k => s.subdomain?.includes(k)));
  const visible = showAll ? subdomains : subdomains.slice(0, 8);
  const recordTypes = ['A','AAAA','MX','NS','TXT','SOA','CAA'];

  return (
    <HUDPanel label="DNS Recon" meta={`${subdomains.length} subs`} accent={ACCENT.cyan}>
      <div className="flex flex-wrap gap-1.5 mb-4">
        <Badge ok={dns.emailSecurity?.spf?.present} label="SPF" />
        <Badge ok={dns.emailSecurity?.dmarc?.present} label="DMARC" />
        <Badge ok={dns.emailSecurity?.dkim?.present} label="DKIM" />
        <span className={`chip ${dns.zoneTransfer?.vulnerable ? 'badge-fail' : 'badge-pass'}`}>
          {dns.zoneTransfer?.vulnerable ? '⚠ AXFR' : '✓ AXFR'}
        </span>
      </div>

      <div className="mb-4 p-3" style={{ background: 'rgba(20,36,58,0.25)', border: '1px solid #14243A' }}>
        <div className="hud-sublabel mb-2">Records</div>
        {recordTypes.map((type, i) => (
          <RecordRow key={type} type={type} records={dns.records?.[type]} delay={i * 0.05} />
        ))}
      </div>

      {subdomains.length > 0 && (
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="hud-sublabel truncate">
              Subdomains {interesting.length > 0 && <span style={{ color: '#FFA31A' }}>· {interesting.length} sens</span>}
            </div>
            <button
              onClick={() => {
                const text = subdomains.map(s => `${s.subdomain} → ${s.ips?.join(', ')}`).join('\n');
                navigator.clipboard.writeText(text);
              }}
              className="hud-sublabel flex-shrink-0"
              style={{ fontSize: '0.6rem' }}
            >
              COPY ALL
            </button>
          </div>
          <div className="space-y-1 max-h-48 scrollable pr-1">
            {visible.map((s, i) => {
              const isInteresting = INTERESTING_KEYWORDS.some(k => s.subdomain?.includes(k));
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  className="flex items-center justify-between gap-2 px-3 py-1.5 font-mono text-xs"
                  style={{
                    background: isInteresting ? 'rgba(255,163,26,0.06)' : 'rgba(20,36,58,0.25)',
                    borderLeft: `2px solid ${isInteresting ? '#FFA31A' : '#14243A'}`
                  }}
                >
                  <span className="truncate" style={{ color: isInteresting ? '#FFA31A' : '#DCE9F5' }}>
                    {isInteresting && <span className="mr-1">★</span>}{s.subdomain}
                  </span>
                  <span className="flex-shrink-0" style={{ color: '#6B8199' }}>{s.ips?.[0] || '?'}</span>
                </motion.div>
              );
            })}
          </div>
          {subdomains.length > 8 && (
            <button
              onClick={() => setShowAll(v => !v)}
              className="mt-2 w-full hud-sublabel text-center py-1"
              style={{ fontSize: '0.6rem' }}
            >
              {showAll ? '▲ COLLAPSE' : `▼ SHOW ALL ${subdomains.length}`}
            </button>
          )}
        </div>
      )}
    </HUDPanel>
  );
}
