import { motion, AnimatePresence } from 'framer-motion';

const MODULE_LABELS = { dns: 'DNS', tls: 'TLS', http: 'HTTP', headers: 'HDRS', ports: 'PORTS' };
const STATUS_COLORS = {
  idle: '#3E5266',
  running: '#00E5FF',
  complete: '#00E08A',
  error: '#FF3355'
};

export function ScanProgress({ status, elapsed, moduleStatus, logs }) {
  if (status === 'idle') return null;

  const mods = Object.entries(moduleStatus);
  const done = mods.filter(([, s]) => s === 'complete' || s === 'error').length;
  const pct = mods.length ? Math.round((done / mods.length) * 100) : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="w-full max-w-3xl mx-auto px-2 sm:px-4 space-y-3"
      >
        {/* Master progress rail */}
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hud-sublabel flex-shrink-0" style={{ fontSize: '0.6rem' }}>SWEEP</span>
          <div className="flex-1 relative h-1 overflow-hidden" style={{ background: 'rgba(20,36,58,0.8)' }}>
            {status === 'scanning' && (
              <motion.div
                className="absolute top-0 h-full"
                style={{ background: 'linear-gradient(90deg, transparent, #00E5FF, transparent)', width: '30%' }}
                animate={{ left: ['-30%', '110%'] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
            {status !== 'scanning' && (
              <div className="h-full" style={{ width: '100%', background: status === 'error' ? '#FF3355' : '#00E08A' }} />
            )}
          </div>
          <span className="font-mono text-xs count-num flex-shrink-0" style={{ color: '#00E5FF' }}>
            {status === 'scanning' ? `${pct}%` : status === 'error' ? 'ERR' : '100%'}
          </span>
        </div>

        {/* Module telemetry pills */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {mods.map(([mod, s]) => {
            const c = STATUS_COLORS[s];
            return (
              <div
                key={mod}
                className="chip"
                style={{ background: s === 'idle' ? 'rgba(20,36,58,0.35)' : `${c}18`, borderColor: `${c}${s === 'idle' ? '40' : '66'}`, color: c }}
              >
                {s === 'running' && <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: c }} />}
                {s === 'complete' && <span>✓</span>}
                {s === 'error' && <span>✗</span>}
                {MODULE_LABELS[mod] || mod.toUpperCase()}
              </div>
            );
          })}

          <div className="ml-auto font-mono text-xs" style={{ color: '#6B8199' }}>
            {status === 'scanning' && (
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00E5FF' }} />
                {String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}
              </span>
            )}
            {status === 'complete' && <span style={{ color: '#00E08A' }}>✓ {elapsed}s</span>}
            {status === 'error' && <span style={{ color: '#FF3355' }}>✗ FAILED</span>}
          </div>
        </div>

        {/* Live feed tail */}
        {logs.length > 0 && status === 'scanning' && (
          <div className="font-mono text-xs space-y-0.5 px-2.5 py-2 overflow-hidden" style={{ background: 'rgba(3,6,11,0.6)', border: '1px solid #14243A' }}>
            {logs.slice(-3).map((log, i, arr) => (
              <div
                key={i}
                className="truncate"
                style={{
                  color: log.type === 'success' ? '#00E08A' : log.type === 'danger' ? '#FF3355' : log.type === 'module' ? '#4D9FFF' : '#6B8199',
                  opacity: i === arr.length - 1 ? 1 : 0.5
                }}
              >
                {log.msg}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
