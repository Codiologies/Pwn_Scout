import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MODELS, isWebGPUSupported } from '../lib/webllm.js';

export function ModelConsentModal({ open, onAccept, onDecline }) {
  const [selected, setSelected] = useState('fast');
  const gpuSupported = isWebGPUSupported();

  const model = MODELS[selected];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(3,6,11,0.88)', backdropFilter: 'blur(6px)' }}
            onClick={onDecline}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
            style={{ pointerEvents: 'none' }}
          >
            <div
              className="hud-panel w-full max-w-md p-5 sm:p-6 space-y-5 max-h-[90vh] overflow-y-auto scrollable"
              style={{
                '--accent': '#00E5FF',
                boxShadow: '0 0 60px rgba(0,229,255,0.12), 0 0 0 1px rgba(0,229,255,0.12)',
                pointerEvents: 'auto'
              }}
            >
              <span className="hud-panel__bracket hud-panel__bracket--tl" />
              <span className="hud-panel__bracket hud-panel__bracket--tr" />
              <span className="hud-panel__bracket hud-panel__bracket--bl" />
              <span className="hud-panel__bracket hud-panel__bracket--br" />

              <div>
                <div className="stencil text-base text-text-primary">DEPLOY AI MODEL</div>
                <div className="hud-sublabel mt-1" style={{ fontSize: '0.62rem' }}>
                  Runs entirely in-browser — zero data leaves this device
                </div>
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                {Object.entries(MODELS).map(([key, m]) => {
                  const active = selected === key;
                  return (
                    <motion.button
                      key={key}
                      type="button"
                      onClick={() => setSelected(key)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="p-3 text-left space-y-2 transition-all"
                      style={{
                        background: active ? 'rgba(0,229,255,0.07)' : 'rgba(20,36,58,0.4)',
                        border: `1px solid ${active ? 'rgba(0,229,255,0.4)' : '#14243A'}`,
                        boxShadow: active ? '0 0 14px rgba(0,229,255,0.1)' : 'none',
                        clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)'
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold" style={{ color: active ? '#00E5FF' : '#DCE9F5' }}>{m.label}</span>
                        <span className="chip flex-shrink-0" style={{ background: active ? 'rgba(0,229,255,0.12)' : 'rgba(255,163,26,0.1)', color: active ? '#00E5FF' : '#FFA31A', borderColor: 'transparent' }}>{m.size}</span>
                      </div>
                      <div className="font-mono text-xs leading-relaxed" style={{ color: '#6B8199' }}>{m.description}</div>
                      <div className="font-mono text-xs" style={{ color: '#4D9FFF' }}>{m.vram}</div>
                    </motion.button>
                  );
                })}
              </div>

              <div className="p-3 space-y-1.5" style={{ background: 'rgba(20,36,58,0.3)', border: '1px solid #14243A' }}>
                <div className="flex items-center justify-between gap-2 font-mono text-xs">
                  <span style={{ color: '#6B8199' }}>Model ID</span>
                  <span className="text-text-primary truncate max-w-[60%]">{model.id}</span>
                </div>
                <div className="flex items-center justify-between gap-2 font-mono text-xs">
                  <span style={{ color: '#6B8199' }}>Cached</span>
                  <span style={{ color: '#00E08A' }}>One-time download</span>
                </div>
                <div className="flex items-center justify-between gap-2 font-mono text-xs">
                  <span style={{ color: '#6B8199' }}>WebGPU</span>
                  <span style={{ color: gpuSupported ? '#00E08A' : '#FF3355' }}>{gpuSupported ? '✓ Supported' : '✗ Not supported'}</span>
                </div>
              </div>

              {!gpuSupported && (
                <div className="p-3 font-mono text-xs break-words" style={{ background: 'rgba(255,51,85,0.08)', borderLeft: '2px solid #FF3355', color: '#FF3355' }}>
                  WebGPU not detected. Use Chrome 113+ or Edge 113+.
                </div>
              )}

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onDecline}
                  className="hud-btn flex-1 py-2.5 text-xs"
                  style={{ '--accent': '#6B8199', color: '#6B8199' }}
                >
                  USE BUILT-IN
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={gpuSupported ? () => onAccept(selected) : onDecline}
                  className={`flex-1 py-2.5 text-xs ${gpuSupported ? 'hud-btn hud-btn--solid' : 'hud-btn'}`}
                  style={{ '--accent': gpuSupported ? '#00E5FF' : '#6B8199', color: gpuSupported ? undefined : '#6B8199' }}
                >
                  {gpuSupported ? `⬇ DEPLOY ${MODELS[selected].size}` : 'USE BUILT-IN'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
