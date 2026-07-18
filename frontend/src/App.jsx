import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanInput } from './components/ScanInput';
import { ScanProgress } from './components/ScanProgress';
import { ResultGrid } from './components/ResultGrid';
import { AIPanel } from './components/AIPanel';
import { Terminal } from './components/Terminal';
import { ModelConsentModal } from './components/ModelConsentModal';
import { Radar, toBlips } from './components/ui/Radar';
import { LED } from './components/ui/HUDPanel';
import { useRecon } from './hooks/useRecon';
import { useAI } from './hooks/useAI';

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now.toLocaleTimeString('en-GB', { hour12: false });
}

function TopRail({ domain, status, elapsed, riskScore, aiState, onAIToggle, aiPanelOpen }) {
  const clock = useClock();

  const aiOnline = aiState.source === 'webllm' && aiState.status === 'ready';
  const aiColor = aiState.status === 'downloading' ? '#FFA31A' : aiOnline ? '#00E08A' : '#6B8199';
  const aiLabel =
    aiState.status === 'downloading'
      ? `${aiState.downloadProgress}%`
      : aiOnline
      ? 'WEBLLM'
      : 'BUILT-IN';

  const statusMap = {
    idle: { c: '#6B8199', t: 'STANDBY' },
    scanning: { c: '#00E5FF', t: 'ACTIVE SWEEP' },
    complete: { c: '#00E08A', t: 'COMPLETE' },
    error: { c: '#FF3355', t: 'FAULT' }
  };
  const st = statusMap[status] || statusMap.idle;

  const riskColor =
    riskScore == null ? '#6B8199' : riskScore >= 80 ? '#FF3355' : riskScore >= 60 ? '#FF6B2C' : riskScore >= 40 ? '#FFA31A' : '#00E08A';

  return (
    <header
      className="relative flex-shrink-0 flex items-center gap-2 sm:gap-4 px-3 sm:px-6 h-13 sm:h-14"
      style={{
        background: 'linear-gradient(180deg, rgba(7,12,20,0.96), rgba(3,6,11,0.9))',
        borderBottom: '1px solid #14243A',
        zIndex: 30,
        height: '3.25rem'
      }}
    >
      {/* Callsign */}
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
        <svg width="24" height="24" viewBox="0 0 26 26" className="flex-shrink-0">
          <circle cx="13" cy="13" r="11" fill="none" stroke="#00E5FF" strokeWidth="1" opacity="0.4" />
          <circle cx="13" cy="13" r="6" fill="none" stroke="#00E5FF" strokeWidth="1" opacity="0.7" />
          <circle cx="13" cy="13" r="1.6" fill="#00E5FF" />
          <line x1="13" y1="0" x2="13" y2="26" stroke="#00E5FF" strokeWidth="0.6" opacity="0.35" />
          <line x1="0" y1="13" x2="26" y2="13" stroke="#00E5FF" strokeWidth="0.6" opacity="0.35" />
        </svg>
        <div className="leading-none min-w-0">
          <div className="stencil text-xs sm:text-sm text-text-primary glow-cyan whitespace-nowrap">
            SCOUT<span style={{ color: '#00E5FF' }}>//OPS</span>
          </div>
          <div className="hud-sublabel mt-0.5 hidden md:block" style={{ fontSize: '0.55rem' }}>ATTACK SURFACE COMMAND</div>
        </div>
      </div>

      <span className="hidden lg:block h-6 w-px flex-shrink-0" style={{ background: '#14243A' }} />

      {/* Target readout */}
      <div className="hidden lg:flex items-center gap-2 font-mono text-xs min-w-0">
        <span className="hud-sublabel flex-shrink-0" style={{ fontSize: '0.55rem' }}>TGT</span>
        <span className="truncate" style={{ color: domain ? '#00E5FF' : '#3E5266' }}>{domain || '— no target —'}</span>
      </div>

      {/* Status cluster */}
      <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
        {/* THREAT */}
        <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1" style={{ border: `1px solid ${riskColor}40`, background: `${riskColor}12` }}>
          <span className="hud-sublabel hidden xs:inline" style={{ fontSize: '0.55rem', color: riskColor }}>THREAT</span>
          <span className="font-mono text-xs font-bold count-num" style={{ color: riskColor }}>
            {riskScore != null ? String(riskScore).padStart(2, '0') : '--'}
          </span>
        </div>

        {/* STATUS */}
        <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1" style={{ border: `1px solid ${st.c}40`, background: `${st.c}12` }}>
          <LED color={st.c} pulse={status === 'scanning'} />
          <span className="hud-sublabel hidden sm:inline" style={{ fontSize: '0.55rem', color: st.c }}>{st.t}</span>
          {status === 'scanning' && (
            <span className="font-mono text-xs count-num" style={{ color: st.c }}>
              {String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}
            </span>
          )}
        </div>

        {/* CLOCK */}
        <span className="hidden xl:block font-mono text-xs count-num" style={{ color: '#6B8199' }}>{clock}</span>

        {/* AI toggle */}
        <button
          onClick={onAIToggle}
          className="hud-btn flex items-center gap-1.5 px-2 sm:px-2.5 py-1 text-xs"
          style={{ '--accent': aiPanelOpen ? '#00E08A' : '#6B8199', color: aiPanelOpen ? '#00E08A' : '#6B8199' }}
          aria-label="Toggle AI panel"
        >
          <LED color={aiColor} pulse={aiState.status === 'downloading'} />
          <span>{aiLabel === 'WEBLLM' || aiLabel === 'BUILT-IN' ? <span className="hidden sm:inline">{aiLabel}</span> : aiLabel}</span>
          <span className="sm:hidden">AI</span>
        </button>
      </div>
    </header>
  );
}

function OpsHero({ recon, onScan, scanning }) {
  const blips = recon.result
    ? toBlips({
        subdomains: recon.result.modules?.dns?.subdomains,
        openPorts: recon.result.modules?.ports?.open,
        findings: recon.result.risk?.findings
      })
    : [];

  return (
    <div className="flex-1 relative overflow-y-auto scrollable">
      <div className="min-h-full flex flex-col items-center justify-center px-3 py-6 sm:py-8">
        {/* Radar station */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex flex-col items-center mb-6"
        >
          <Radar
            blips={blips}
            active={scanning}
            size="min(70vw, 240px)"
            label={scanning ? 'SCANNING' : recon.status === 'error' ? 'FAULT' : 'STANDBY'}
          />
          <div className="stencil text-3xl xs:text-4xl sm:text-5xl mt-6 text-text-primary text-center">
            PWN<span className="glow-cyan" style={{ color: '#00E5FF' }}>SCOUT</span>
          </div>
          <div className="hud-sublabel mt-2 text-center px-2" style={{ letterSpacing: '0.2em' }}>
            Autonomous Attack Surface Intelligence
          </div>
        </motion.div>

        {/* Scan console */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="w-full relative z-10"
        >
          <ScanInput onScan={onScan} scanning={scanning} />
        </motion.div>

        {/* Capability strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-6 max-w-2xl px-2"
        >
          {['DNS RECON', 'TLS AUDIT', 'HTTP FINGERPRINT', 'HEADER SCAN', 'PORT SWEEP', 'AI ANALYST'].map((f, i) => (
            <span key={i} className="flex items-center gap-1.5 hud-sublabel" style={{ fontSize: '0.6rem' }}>
              <span style={{ color: '#00E08A' }}>▸</span> {f}
            </span>
          ))}
        </motion.div>

        {/* Progress readout */}
        {recon.status !== 'idle' && recon.status !== 'complete' && (
          <div className="w-full mt-8">
            <ScanProgress status={recon.status} elapsed={recon.elapsed} moduleStatus={recon.moduleStatus} logs={recon.logs} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const recon = useRecon();
  const ai = useAI();
  const [terminalOpen, setTerminalOpen] = useState(false);

  const handleScan = (target, modules) => {
    recon.scan(target, modules);
    ai.clearChat();
    if (ai.panelOpen) ai.setPanelOpen(false);
    setTerminalOpen(true);
  };

  const handleAIAnalyze = (modules, domain) => {
    ai.analyze(modules, domain);
    ai.setPanelOpen(true);
  };

  const handleReset = () => {
    recon.reset();
    setTerminalOpen(false);
  };

  const scanning = recon.status === 'scanning';
  const hasResult = recon.status === 'complete' && recon.result;

  return (
    <div className="h-full flex flex-col relative overflow-hidden crt" style={{ background: '#03060B' }}>
      {/* Ambient deck */}
      <div className="deck-bg">
        <div className="grid-floor" />
        <div className="dot-matrix" />
        <div className="glow-pool" style={{ top: '-10%', left: '-5%', width: 380, height: 380, background: 'rgba(0,229,255,0.10)' }} />
        <div className="glow-pool" style={{ bottom: '-15%', right: '-8%', width: 420, height: 420, background: 'rgba(255,107,44,0.07)' }} />
        <div className="vignette" />
      </div>

      {/* Content column — shrinks on desktop so the AI panel docks beside it
          (rather than overlapping the results). On mobile the panel overlays. */}
      <div
        className={`flex-1 flex flex-col min-h-0 min-w-0 transition-[margin] duration-300 ease-out ${
          ai.panelOpen ? 'lg:mr-96' : ''
        }`}
      >
        <TopRail
          domain={recon.domain}
          status={recon.status}
          elapsed={recon.elapsed}
          riskScore={recon.result?.risk?.score}
          aiState={ai.aiState}
          onAIToggle={() => ai.setPanelOpen(v => !v)}
          aiPanelOpen={ai.panelOpen}
        />

        <div className="flex-1 flex flex-col min-h-0 relative z-10">
          <AnimatePresence mode="wait">
            {!hasResult ? (
              <motion.div key="hero" className="flex-1 flex flex-col min-h-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <OpsHero recon={recon} onScan={handleScan} scanning={scanning} />
              </motion.div>
            ) : (
              <motion.div key="results" className="flex-1 flex flex-col min-h-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Ops command bar */}
                <div className="flex-shrink-0 py-2 sm:py-2.5 px-3 sm:px-4 flex items-start gap-2 sm:gap-3" style={{ borderBottom: '1px solid #14243A', background: 'rgba(7,12,20,0.6)' }}>
                  <div className="flex-1 min-w-0">
                    <ScanInput onScan={handleScan} scanning={scanning} compact />
                  </div>
                  <button onClick={handleReset} className="hud-btn px-2.5 sm:px-3 py-2 text-xs flex-shrink-0 mt-[1px]" style={{ '--accent': '#FF3355', color: '#FF3355' }}>
                    <span className="hidden xs:inline">⟲ RESET</span>
                    <span className="xs:hidden">⟲</span>
                  </button>
                </div>

                <div className="flex-1 min-h-0">
                  <ResultGrid result={recon.result} onAIAnalyze={handleAIAnalyze} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-shrink-0 relative z-20">
          <Terminal logs={recon.logs} open={terminalOpen} onToggle={() => setTerminalOpen(v => !v)} />
        </div>
      </div>

      {/* AI panel + consent — siblings of the content column so the panel
          docks into the reserved margin instead of covering the dashboard. */}
      <AIPanel
        open={ai.panelOpen}
        onClose={() => ai.setPanelOpen(false)}
        aiState={ai.aiState}
        analysis={ai.analysis}
        analysisLoading={ai.analysisLoading}
        messages={ai.messages}
        chatLoading={ai.chatLoading}
        onSend={(msg) => ai.sendMessage(msg, { domain: recon.domain, riskScore: recon.result?.risk?.score, scanData: recon.result })}
        onCancelDownload={ai.cancelDownload}
        onSwitchModel={ai.switchModel}
        suggestedPrompts={ai.suggestedPrompts}
        domain={recon.domain}
        riskScore={recon.result?.risk?.score}
      />

      <ModelConsentModal open={ai.showConsentModal} onAccept={ai.handleConsentAccept} onDecline={ai.handleConsentDecline} />
    </div>
  );
}
