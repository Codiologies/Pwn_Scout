import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function MarkdownText({ text }) {
  if (!text) return null;
  const rawLines = text.split('\n');
  const lines = [];
  for (let i = 0; i < rawLines.length; i++) {
    if (rawLines[i].match(/^\d+\.?\s*$/) && i + 1 < rawLines.length && rawLines[i + 1].trim()) {
      lines.push(rawLines[i].trim().replace(/\.?$/, '') + '. ' + rawLines[i + 1].trim());
      i++;
    } else {
      lines.push(rawLines[i]);
    }
  }
  const codeStyle = { background: '#03060B', color: '#00E5FF', fontFamily: 'monospace' };
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const parts = line.split(/(`[^`]+`)/g);
        const rendered = parts.map((part, j) => {
          if (part.startsWith('`') && part.endsWith('`')) {
            return <code key={j} className="px-1 py-0.5 text-xs" style={codeStyle}>{part.slice(1, -1)}</code>;
          }
          const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
          return boldParts.map((bp, k) =>
            bp.startsWith('**') && bp.endsWith('**')
              ? <strong key={k} style={{ color: '#DCE9F5' }}>{bp.slice(2, -2)}</strong>
              : <span key={k}>{bp}</span>
          );
        });

        if (line.match(/^[-*•]\s/)) {
          return <div key={i} className="flex items-start gap-1.5"><span style={{ color: '#00E5FF' }}>›</span><span>{rendered}</span></div>;
        }
        if (line.match(/^\d+\.\s/)) {
          const num = line.match(/^\d+/)[0];
          const rest = line.replace(/^\d+\.\s*/, '');
          const restParts = rest.split(/(`[^`]+`)/g).map((part, j) => {
            if (part.startsWith('`') && part.endsWith('`')) {
              return <code key={j} className="px-1 py-0.5 text-xs" style={codeStyle}>{part.slice(1, -1)}</code>;
            }
            return part.split(/(\*\*[^*]+\*\*)/g).map((bp, k) =>
              bp.startsWith('**') && bp.endsWith('**')
                ? <strong key={k} style={{ color: '#DCE9F5' }}>{bp.slice(2, -2)}</strong>
                : <span key={k}>{bp}</span>
            );
          });
          return <div key={i} className="flex items-start gap-1.5"><span style={{ color: '#4D9FFF' }} className="flex-shrink-0">{num}.</span><span>{restParts}</span></div>;
        }
        if (line.match(/^\d+\.?\s*$/)) return null;
        if (!line.trim()) return <div key={i} className="h-1" />;
        return <div key={i}>{rendered}</div>;
      })}
    </div>
  );
}

function ToolCommand({ cmd }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative group">
      <pre className="font-mono text-xs p-2 pr-14 break-all" style={{ background: '#03060B', border: '1px solid #14243A', color: '#00E5FF' }}>{cmd}</pre>
      <button
        onClick={() => { navigator.clipboard.writeText(cmd); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
        className="absolute top-1.5 right-2 font-mono text-xs px-2 py-0.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: 'rgba(0,229,255,0.1)', color: '#00E5FF', border: '1px solid rgba(0,229,255,0.25)' }}
      >
        {copied ? '✓' : 'COPY'}
      </button>
    </div>
  );
}

function DownloadProgress({ progress, text, onCancel }) {
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: '#00E5FF' }} />
          <span className="font-mono text-xs text-text-primary">Downloading model...</span>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="hud-btn px-2.5 py-1 font-mono text-xs flex-shrink-0"
            style={{ '--accent': '#FF3355', color: '#FF3355' }}
          >
            CANCEL
          </button>
        )}
      </div>
      <div className="space-y-1.5">
        <div className="telemetry-track telemetry-track--seg" style={{ height: 6, '--accent': '#00E5FF' }}>
          <motion.div className="telemetry-fill" style={{ '--accent': '#00E5FF' }} animate={{ width: `${progress}%` }} transition={{ ease: 'easeOut' }} />
        </div>
        <div className="flex justify-between font-mono text-xs" style={{ color: '#6B8199' }}>
          <span className="truncate max-w-[70%]">{text}</span>
          <span style={{ color: '#00E5FF' }}>{progress}%</span>
        </div>
      </div>
      <div className="font-mono text-xs" style={{ color: '#6B8199' }}>Cached after first download. No server involved.</div>
    </div>
  );
}

function ModelSwitcher({ aiState, onSwitch, disabled }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const options = [
    { key: 'fast', label: '0.6B Fast', color: '#00E5FF', icon: '⚡' },
    { key: 'smart', label: '1.7B Smart', color: '#4D9FFF', icon: '🧠' },
    { key: 'builtin', label: 'Built-in', color: '#FFA31A', icon: '⚙' },
  ];

  const currentKey = aiState.activeModelKey || (aiState.source === 'builtin' ? 'builtin' : null);
  const currentOption = options.find(o => o.key === currentKey) || options[2];

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setDropdownOpen(v => !v)}
        disabled={disabled}
        className="flex items-center gap-1.5 px-2 py-1 font-mono text-xs transition-all disabled:opacity-40"
        style={{
          background: 'rgba(20,36,58,0.6)',
          border: `1px solid ${currentOption.color}33`,
          color: currentOption.color,
        }}
      >
        <span>{currentOption.icon}</span>
        <span>{currentOption.label}</span>
        <span style={{ fontSize: '0.5rem', opacity: 0.6 }}>{dropdownOpen ? '▲' : '▼'}</span>
      </button>

      <AnimatePresence>
        {dropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1 z-50 min-w-[160px]"
            style={{
              background: 'rgba(10,18,28,0.98)',
              border: '1px solid #1E3A5C',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}
          >
            {options.map(opt => {
              const isActive = opt.key === currentKey;
              return (
                <button
                  key={opt.key}
                  onClick={() => {
                    if (!isActive) onSwitch(opt.key);
                    setDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 font-mono text-xs text-left transition-all"
                  style={{
                    background: isActive ? `${opt.color}12` : 'transparent',
                    color: isActive ? opt.color : '#6B8199',
                    borderLeft: isActive ? `2px solid ${opt.color}` : '2px solid transparent',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${opt.color}12`; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                  {isActive && <span style={{ color: opt.color, marginLeft: 'auto' }}>✓</span>}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AIPanel({ open, onClose, aiState, analysis, analysisLoading, messages, chatLoading, onSend, onCancelDownload, onSwitchModel, suggestedPrompts }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  const send = () => {
    if (!input.trim() || chatLoading) return;
    onSend(input.trim());
    setInput('');
  };

  const sourceLabel = aiState.source === 'webllm' ? aiState.modelId || 'Llama-3.2-1B' : 'Built-in Engine';
  const sourceColor = aiState.source === 'webllm' ? '#00E08A' : '#FFA31A';
  const isDownloading = aiState.status === 'downloading';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-0 right-0 h-full w-full sm:w-96 max-w-full flex flex-col z-40"
          style={{ background: 'linear-gradient(180deg, rgba(10,18,28,0.98), rgba(3,6,11,0.98))', borderLeft: '1px solid #1E3A5C', boxShadow: '-20px 0 60px rgba(0,0,0,0.6)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0 hud-panel__bar" style={{ '--accent': '#00E08A' }}>
            <div className="min-w-0">
              <div className="stencil text-sm text-text-primary">AI ANALYST</div>
              <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                <span className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: sourceColor, boxShadow: `0 0 6px ${sourceColor}` }} />
                <span className="hud-sublabel truncate" style={{ fontSize: '0.6rem' }}>{sourceLabel}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <ModelSwitcher
                aiState={aiState}
                onSwitch={onSwitchModel}
                disabled={isDownloading || chatLoading || analysisLoading}
              />
              <button onClick={onClose} className="hud-btn px-2.5 py-1 text-sm flex-shrink-0" style={{ '--accent': '#FF3355', color: '#FF3355' }}>✕</button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 scrollable min-h-0">
            {isDownloading && <DownloadProgress progress={aiState.downloadProgress} text={aiState.downloadText} onCancel={onCancelDownload} />}

            {analysisLoading && !isDownloading && (
              <div className="p-4 space-y-3">
                <div className="font-mono text-xs animate-pulse" style={{ color: '#6B8199' }}>Analyzing recon data...</div>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 animate-pulse" style={{ background: 'rgba(20,36,58,0.6)', borderLeft: '2px solid #14243A' }} />
                ))}
              </div>
            )}

            {analysis && !analysisLoading && !isDownloading && (
              <div className="p-4 space-y-4" style={{ borderBottom: '1px solid #14243A' }}>
                <span className="chip" style={{
                  background: analysis.source === 'webllm' ? 'rgba(0,224,138,0.1)' : 'rgba(255,163,26,0.1)',
                  color: analysis.source === 'webllm' ? '#00E08A' : '#FFA31A',
                  borderColor: analysis.source === 'webllm' ? 'rgba(0,224,138,0.3)' : 'rgba(255,163,26,0.3)'
                }}>
                  {analysis.source === 'webllm' ? `🧠 ${analysis.model}` : '⚙ Rule Engine'}
                </span>

                {analysis.streaming && (
                  <div className="font-mono text-xs">
                    {analysis.raw
                      ? <span style={{ color: '#6B8199' }}>Generating analysis<span className="animate-pulse">...</span></span>
                      : <span className="animate-pulse" style={{ color: '#6B8199' }}>thinking<span className="animate-blink">...</span></span>}
                  </div>
                )}

                {analysis.analysis?.attackVectors?.length > 0 && !analysis.streaming && (
                  <div>
                    <div className="hud-sublabel mb-2">Attack Vectors</div>
                    <div className="space-y-2">
                      {analysis.analysis.attackVectors.map((v, i) => (
                        <div key={i} className="p-3 text-xs font-mono break-words" style={{ background: 'rgba(255,51,85,0.06)', borderLeft: '2px solid #FF3355', color: '#DCE9F5' }}>
                          <span style={{ color: '#FF3355' }} className="mr-2">{i + 1}.</span>{v}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.analysis?.quickWins?.length > 0 && !analysis.streaming && (
                  <div>
                    <div className="hud-sublabel mb-2">Quick Wins</div>
                    <div className="space-y-1">
                      {analysis.analysis.quickWins.map((w, i) => (
                        <div key={i} className="flex items-start gap-2 font-mono text-xs text-text-primary break-words">
                          <span style={{ color: '#00E08A' }} className="flex-shrink-0">›</span><span>{w}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.analysis?.interesting?.length > 0 && !analysis.streaming && (
                  <div>
                    <div className="hud-sublabel mb-2">Interesting</div>
                    <div className="space-y-1">
                      {analysis.analysis.interesting.map((f, i) => (
                        <div key={i} className="flex items-start gap-2 font-mono text-xs break-words" style={{ color: '#FFA31A' }}>
                          <span className="flex-shrink-0">★</span><span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.analysis?.tools?.length > 0 && !analysis.streaming && (
                  <div>
                    <div className="hud-sublabel mb-2">Tool Commands</div>
                    <div className="space-y-2">
                      {analysis.analysis.tools.map((t, i) => <ToolCommand key={i} cmd={t} />)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Chat messages */}
            <div className="p-4 space-y-3">
              {messages.length === 0 && !analysisLoading && !analysis && !isDownloading && (
                <div className="font-mono text-xs text-center py-4" style={{ color: '#6B8199' }}>
                  Run a scan then hit AI ANALYZE,<br />or ask a question below.
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className="max-w-[85%] px-3 py-2 font-mono text-xs break-words"
                    style={{
                      background: msg.role === 'user' ? 'rgba(77,159,255,0.12)' : 'rgba(20,36,58,0.5)',
                      borderLeft: `2px solid ${msg.role === 'user' ? '#4D9FFF' : '#00E08A'}`,
                      color: '#6B8199'
                    }}
                  >
                    {msg.role === 'assistant'
                      ? msg.streaming && !msg.content
                        ? <span className="animate-pulse" style={{ color: '#6B8199' }}>thinking...</span>
                        : <MarkdownText text={msg.content} />
                      : <span style={{ color: '#DCE9F5' }}>{msg.content}</span>}
                    {msg.streaming && msg.content && <span className="animate-blink ml-0.5" style={{ color: '#00E5FF' }}>▊</span>}
                  </div>
                </div>
              ))}

              {chatLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex justify-start">
                  <div className="px-3 py-2 font-mono text-xs" style={{ background: 'rgba(20,36,58,0.5)', borderLeft: '2px solid #00E08A', color: '#6B8199' }}>
                    <span className="animate-pulse">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Suggested prompts */}
          {messages.length === 0 && !isDownloading && (
            <div className="px-4 py-2 flex flex-wrap gap-1.5 flex-shrink-0" style={{ borderTop: '1px solid #14243A' }}>
              {suggestedPrompts.slice(0, 3).map((p, i) => (
                <button
                  key={i}
                  onClick={() => onSend(p)}
                  className="font-mono text-xs px-2.5 py-1 transition-all"
                  style={{ background: 'rgba(20,36,58,0.5)', color: '#6B8199', border: '1px solid #14243A' }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Chat input */}
          <div className="p-3 flex gap-2 flex-shrink-0" style={{ borderTop: '1px solid #14243A', paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder={isDownloading ? 'Downloading model...' : 'Ask anything...'}
              disabled={isDownloading}
              className="flex-1 min-w-0 bg-transparent font-mono text-xs text-text-primary placeholder-text-muted/40 focus:outline-none px-3 py-2 disabled:opacity-40"
              style={{ background: 'rgba(20,36,58,0.4)', border: '1px solid #14243A' }}
            />
            <button onClick={send} disabled={!input.trim() || chatLoading || isDownloading} className="hud-btn px-4 py-2 text-xs flex-shrink-0" style={{ '--accent': '#00E08A' }}>SEND</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
