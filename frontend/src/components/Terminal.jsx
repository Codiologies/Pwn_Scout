import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LOG_COLORS = {
  system: '#6B8199',
  module: '#4D9FFF',
  success: '#00E08A',
  danger: '#FF3355',
  info: '#6B8199'
};

export function Terminal({ logs, open, onToggle }) {
  const bottomRef = useRef(null);
  const [maxVisible] = useState(200);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, open]);

  return (
    <div className="relative" style={{ borderTop: '1px solid #14243A', background: 'rgba(3,6,11,0.85)' }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 sm:px-4 py-2 font-mono text-xs transition-colors"
        style={{ color: '#6B8199' }}
      >
        <span className="flex items-center gap-2 min-w-0">
          <span style={{ color: '#00E5FF' }}>▸</span>
          <span className="hud-sublabel">TELEMETRY FEED</span>
          {logs.length > 0 && <span style={{ color: '#3E5266' }}>[{logs.length}]</span>}
        </span>
        <span style={{ color: '#00E5FF' }}>{open ? '▼' : '▲'}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 160 }}
            exit={{ height: 0 }}
            style={{ overflow: 'hidden', background: '#03060B' }}
          >
            <div className="h-full scrollable p-3 font-mono text-xs" style={{ height: 160 }}>
              {logs.length === 0 && <div style={{ color: '#3E5266' }}>▸ awaiting sweep...</div>}
              {logs.slice(-maxVisible).map((log, i) => (
                <div key={i} className="feed-row" style={{ color: LOG_COLORS[log.type] || '#6B8199' }}>
                  <span style={{ color: '#3E5266', flexShrink: 0 }}>›</span>
                  <span className="break-all">{log.msg}</span>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
