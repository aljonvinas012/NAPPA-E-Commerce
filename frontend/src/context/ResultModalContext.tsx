import { createContext, useContext, useState, type ReactNode } from 'react';

interface ResultModalOptions {
  type: 'success' | 'error';
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

interface ResultModalContextType {
  showResult: (options: ResultModalOptions) => void;
  closeResult: () => void;
}

const ResultModalContext = createContext<ResultModalContextType | undefined>(undefined);

export const ResultModalProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<ResultModalOptions | null>(null);

  const showResult = (options: ResultModalOptions) => setState(options);
  const closeResult = () => setState(null);

  return (
    <ResultModalContext.Provider value={{ showResult, closeResult }}>
      {children}
      {state && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4 animate-fade-in"
          onClick={closeResult}
        >
          <div
            className="bg-paper rounded-card shadow-card w-full max-w-xs p-6 text-center animate-pop-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-xl mb-3 animate-check-pop ${
                state.type === 'success' ? 'bg-oliveDark/15 text-oliveDark' : 'bg-red-50 text-red-500'
              }`}
            >
              {state.type === 'success' ? <i className="fas fa-check" /> : <i className="fas fa-xmark" />}
            </div>
            <h3 className="font-display text-lg text-bark mb-1.5">{state.title}</h3>
            {state.message && <p className="text-sm text-bark/60 mb-5 leading-relaxed">{state.message}</p>}
            <div className="flex gap-2.5">
              {state.secondaryLabel && (
                <button
                  onClick={() => { state.onSecondary?.(); closeResult(); }}
                  className="btn-secondary flex-1 !py-2 !px-3 text-sm"
                >
                  {state.secondaryLabel}
                </button>
              )}
              <button
                onClick={() => { state.onAction ? state.onAction() : undefined; closeResult(); }}
                className={`flex-1 !py-2 !px-3 text-sm ${state.type === 'success' ? 'btn-primary' : 'btn-secondary'}`}
              >
                {state.actionLabel || 'Okay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ResultModalContext.Provider>
  );
};

export const useResultModal = () => {
  const ctx = useContext(ResultModalContext);
  if (!ctx) throw new Error('useResultModal must be used within ResultModalProvider');
  return ctx;
};
