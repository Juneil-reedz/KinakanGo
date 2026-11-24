import { createContext, useCallback, useContext, useRef, useState } from 'react';

// In-app replacement for window.confirm / window.prompt. Browser dialogs are
// blocked or silently skipped in some places (in-app browsers like Messenger,
// home-screen apps), which made buttons look like they did nothing.
//
//   const ask = useDialog();
//   if (await ask({ title: 'Delete this address?', confirmLabel: 'Delete', danger: true })) ...
//   const text = await ask({ title: '...', input: true });  // null when cancelled
const DialogContext = createContext(null);

export function DialogProvider({ children }) {
  const [dlg, setDlg] = useState(null);
  const [value, setValue] = useState('');
  const resolver = useRef(null);

  const ask = useCallback((opts) => new Promise((resolve) => {
    resolver.current = resolve;
    setValue(opts.defaultValue || '');
    setDlg(opts);
  }), []);

  const close = (result) => {
    resolver.current?.(result);
    resolver.current = null;
    setDlg(null);
  };

  return (
    <DialogContext.Provider value={ask}>
      {children}
      {dlg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(8,6,5,.6)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) close(dlg.input ? null : false); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="app-dialog-title"
            className="clay-modal w-full max-w-sm p-6 space-y-3">
            <p id="app-dialog-title" className="text-white font-heading font-bold text-lg">{dlg.title}</p>
            {dlg.message && <p className="text-forest-200/70 text-sm whitespace-pre-line">{dlg.message}</p>}
            {dlg.input && (
              <textarea autoFocus value={value} onChange={e => setValue(e.target.value)} rows={3} maxLength={1000}
                placeholder={dlg.placeholder || ''} className="w-full input-glass px-3 py-2.5 text-sm rounded-xl resize-none" />
            )}
            <div className="flex gap-2 pt-1">
              <button onClick={() => close(dlg.input ? null : false)} className="flex-1 glass text-forest-200 text-sm py-3 rounded-xl">
                {dlg.cancelLabel || 'Cancel'}
              </button>
              <button onClick={() => close(dlg.input ? value : true)}
                className={`flex-1 text-white text-sm font-semibold py-3 rounded-xl ${dlg.danger ? 'bg-red-500/80 hover:bg-red-500' : 'btn-glow-green'}`}>
                {dlg.confirmLabel || 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used within DialogProvider');
  return ctx;
}
