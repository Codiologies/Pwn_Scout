import { useState } from 'react';
import { motion } from 'framer-motion';
import { HUDPanel, ACCENT } from './ui/HUDPanel';

const SENSITIVE = ['admin','login','dev','staging','test','backup','internal','jenkins','git','jira','vpn','secure','panel','manage'];

export function SubdomainCard({ dns }) {
  const [filter, setFilter] = useState('all');
  const [copied, setCopied] = useState(false);

  if (!dns || !dns.subdomains?.length) return null;

  const subdomains = dns.subdomains || [];
  const sensitive = subdomains.filter(s => SENSITIVE.some(k => s.subdomain?.includes(k)));
  const displayed = filter === 'sensitive' ? sensitive : subdomains;

  const copyAll = () => {
    const text = subdomains.map(s => s.subdomain).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <HUDPanel
      label="Subdomain Map"
      meta={`${subdomains.length} live${sensitive.length ? ` · ${sensitive.length} sens` : ''}`}
      accent={sensitive.length ? ACCENT.amber : ACCENT.cyan}
      delay={0.08}
      actions={
        <button
          onClick={copyAll}
          className="hud-btn px-2 sm:px-2.5 py-1 text-xs flex-shrink-0"
          style={{ '--accent': copied ? '#00E08A' : '#6B8199', color: copied ? '#00E08A' : '#6B8199' }}
        >
          {copied ? '✓' : 'COPY'}
        </button>
      }
    >
      <div className="flex gap-1.5 mb-3">
        {[['all', 'ALL'], ['sensitive', 'SENSITIVE']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className="chip"
            style={{
              background: filter === val ? 'rgba(0,229,255,0.1)' : 'transparent',
              color: filter === val ? '#00E5FF' : '#6B8199',
              borderColor: filter === val ? 'rgba(0,229,255,0.35)' : '#14243A'
            }}
          >
            {label}
            {val === 'sensitive' && sensitive.length > 0 && (
              <span className="ml-1 px-1" style={{ background: 'rgba(255,163,26,0.2)', color: '#FFA31A' }}>{sensitive.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="max-h-64 scrollable space-y-1 pr-1">
        {displayed.map((s, i) => {
          const isSensitive = SENSITIVE.some(k => s.subdomain?.includes(k));
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.3) }}
              className="flex items-center gap-2 sm:gap-3 px-3 py-2 font-mono text-xs"
              style={{
                background: isSensitive ? 'rgba(255,163,26,0.05)' : 'rgba(20,36,58,0.25)',
                borderLeft: `2px solid ${isSensitive ? '#FFA31A' : '#14243A'}`
              }}
            >
              <span className="flex-1 truncate" style={{ color: isSensitive ? '#FFA31A' : '#DCE9F5' }}>
                {isSensitive && <span className="mr-1">★</span>}{s.subdomain}
              </span>
              <span className="flex-shrink-0" style={{ color: '#6B8199' }}>{s.ips?.[0] || '?'}</span>
              {isSensitive && <span className="chip flex-shrink-0 hidden xs:inline-flex" style={{ background: 'rgba(255,163,26,0.12)', color: '#FFA31A', borderColor: 'rgba(255,163,26,0.3)' }}>SENS</span>}
            </motion.div>
          );
        })}
      </div>

      {dns.zoneTransfer && (
        <div className="mt-3 p-2.5 font-mono text-xs break-words" style={{ background: 'rgba(20,36,58,0.25)', border: '1px solid #14243A' }}>
          <span style={{ color: '#6B8199' }}>Zone Transfer (AXFR): </span>
          <span style={{ color: dns.zoneTransfer.vulnerable ? '#FF3355' : '#00E08A' }}>
            {dns.zoneTransfer.vulnerable ? '⚠ VULNERABLE' : '✓ SECURE'}
          </span>
        </div>
      )}
    </HUDPanel>
  );
}
