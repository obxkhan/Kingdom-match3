import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  public state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let friendly = 'Something went wrong while syncing your city.';
    try {
      const parsed = JSON.parse(error.message) as {
        error?: string;
        operationType?: string;
      };
      if (parsed && parsed.error) {
        friendly = `Cloud sync issue (${parsed.operationType ?? 'request'}): ${parsed.error}`;
      }
    } catch {
      if (error.message) {
        friendly = error.message;
      }
    }
    return {
      hasError: true,
      message: friendly,
    };
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('TileTown ErrorBoundary:', error, info.componentStack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh items-center justify-center bg-[#F3EFE6] px-4 text-slate-900">
          <div className="w-full max-w-md rounded-2xl border border-[#D8CFC0] bg-[#FAF7F0] p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-[family-name:var(--font-display)] text-lg font-bold text-slate-900">
                  TileTown paused safely
                </h1>
                <p className="text-xs text-slate-600">
                  Your saved progress in the cloud is safe.
                </p>
              </div>
            </div>

            <p className="mt-4 rounded-xl border border-[#E4DDD0] bg-white p-3 text-xs leading-relaxed text-slate-700">
              {this.state.message}
            </p>

            <button
              type="button"
              onClick={this.handleReload}
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reload TileTown</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
