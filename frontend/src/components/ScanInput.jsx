import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const EXAMPLE_TARGETS = ['example.com', 'github.com', 'shopify.com', 'stripe.com', 'cloudflare.com'];
const MODULES = [
  { id: 'dns',     label: 'DNS',     desc: 'Records + Subdomains' },
  { id: 'tls',     label: 'TLS',     desc: 'Cert Analysis' },
  { id: 'http',    label: 'HTTP',    desc: 'Fingerprinting' },
  { id: 'headers', label: 'HDRS',    desc: 'Security Audit' },
  { id: 'ports',   label: 'PORTS',   desc: 'Top 27 ports + service detection' }
];

export function ScanInput({ onScan, scanning, compact = false }) {
  const [target, setTarget] = useState('');
  const [selectedModules, setSelectedModules] = useState(['dns', 'tls', 'http', 'headers', 'ports']);
  const [focused, setFocused] = useState(false);
  const [ghostIdx, setGhostIdx] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    const cycle = setInterval(() => setGhostIdx(i => (i + 1) % EXAMPLE_TARGETS.length), 3000);
    return () => clearInterval(cycle);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const toggleModule = (id) => {
    setSelectedModules(prev =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter(m => m !== id) : prev) : [...prev, id]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!target.trim() || scanning) return;
    onScan(target.trim(), selectedModules);
  };

  return (
    <div className={`w-full mx-auto ${compact ? '' : 'max-w-3xl px-2 sm:px-4'}`}>
      <form onSubmit={handleSubmit}>
        {/* Command line */}
        <motion.div
          className="relative hud-panel"
          style={{
            '--accent': '#00E5FF',
            borderColor: focused ? 'rgba(0,229,255,0.55)' : undefined,
            boxShadow: focused ? '0 0 0 1px rgba(0,229,255,0.25), 0 0 30px rgba(0,229,255,0.12)' : undefined
          }}
          animate={focused && !compact ? { scale: 1.004 } : { scale: 1 }}
          transition={{ duration: 0.15 }}
        >
          {!compact && (
            <>
              <span className="hud-panel__bracket hud-panel__bracket--tl" />
              <span className="hud-panel__bracket hud-panel__bracket--br" />
            </>
          )}
          <div className={`flex items-center gap-2 sm:gap-3 ${compact ? 'px-2.5 py-2' : 'px-3 sm:px-4 py-3'}`}>
            <span className="hud-sublabel flex-shrink-0" style={{ color: '#00E5FF' }}>TGT&gt;</span>
            <input
              ref={inputRef}
              type="text"
              value={target}
              onChange={e => setTarget(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={`acquire ${EXAMPLE_TARGETS[ghostIdx]}`}
              disabled={scanning}
              className="flex-1 min-w-0 bg-transparent font-mono text-text-primary focus:outline-none disabled:opacity-50"
              style={{ fontSize: compact ? '0.9rem' : '1rem', letterSpacing: '0.02em' }}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
              {!compact && <span className="hud-sublabel hidden md:block" style={{ fontSize: '0.6rem' }}>⌘K</span>}
              <motion.button
                type="submit"
                disabled={!target.trim() || scanning}
                whileHover={!scanning && target ? { scale: 1.02 } : {}}
                whileTap={!scanning && target ? { scale: 0.98 } : {}}
                className={`hud-btn whitespace-nowrap ${target && !scanning ? 'hud-btn--solid' : ''} ${compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 sm:px-5 py-2 text-xs sm:text-sm'}`}
                style={{ '--accent': scanning ? '#00E5FF' : '#FF3355' }}
              >
                {scanning ? (
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: '#00E5FF' }} />
                    <span className="hidden xs:inline">{compact ? 'BUSY' : 'SWEEPING'}</span>
                  </span>
                ) : (
                  <>
                    <span className={compact ? '' : 'sm:hidden'}>SCAN</span>
                    {!compact && <span className="hidden sm:inline">INITIATE SWEEP</span>}
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Module bank */}
        <div className={`flex items-center flex-wrap ${compact ? 'gap-1.5 mt-2 justify-start' : 'gap-1.5 sm:gap-2 mt-3 justify-center sm:justify-start'}`}>
          {!compact && <span className="hud-sublabel mr-1 hidden sm:block" style={{ fontSize: '0.6rem' }}>MODULES //</span>}
          {MODULES.map(mod => {
            const active = selectedModules.includes(mod.id);
            return (
              <motion.button
                key={mod.id}
                type="button"
                onClick={() => toggleModule(mod.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="chip"
                style={{
                  background: active ? 'rgba(0,229,255,0.12)' : 'rgba(20,36,58,0.4)',
                  color: active ? '#00E5FF' : '#6B8199',
                  borderColor: active ? 'rgba(0,229,255,0.4)' : '#14243A',
                  boxShadow: active ? '0 0 10px rgba(0,229,255,0.15)' : 'none'
                }}
                title={mod.desc}
              >
                {active && <span style={{ fontSize: '0.5rem' }}>●</span>}
                {mod.label}
              </motion.button>
            );
          })}
          {!compact && (
            <span className="hud-sublabel ml-auto hidden sm:block" style={{ fontSize: '0.6rem' }}>
              {selectedModules.length}/{MODULES.length} ONLINE
            </span>
          )}
        </div>

        {/* Cloud port-scan advisory */}
        {import.meta.env.PROD && selectedModules.includes('ports') && !compact && (
          <div className="mt-2 flex items-start gap-2 px-2.5 py-1.5" style={{ background: 'rgba(255,163,26,0.06)', border: '1px solid rgba(255,163,26,0.25)' }}>
            <span style={{ color: '#FFA31A' }} className="flex-shrink-0">⚠</span>
            <span className="font-mono uppercase" style={{ color: '#6B8199', fontSize: '0.66rem', lineHeight: 1.4, letterSpacing: '0.03em' }}>
              Port sweep runs from a cloud server IP — firewall rules may hide open ports versus a local scan.
            </span>
          </div>
        )}
      </form>
    </div>
  );
}
