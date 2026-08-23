import { Component, ErrorInfo, ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

class ErrorBoundary extends Component<Props, State> {
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  state: State = { hasError: false, error: null, retryCount: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
    // Auto-retry up to 3 times silently with backoff
    if (this.state.retryCount < 3) {
      const delay = 1500 * (this.state.retryCount + 1);
      this.retryTimer = setTimeout(() => {
        this.setState((s) => ({ hasError: false, error: null, retryCount: s.retryCount + 1 }));
      }, delay);
    }
  }

  componentWillUnmount() {
    if (this.retryTimer) clearTimeout(this.retryTimer);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.href = "/";
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    // Auto-retrying silently
    if (this.state.retryCount < 3) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-3"
          >
            <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Qayta urinilmoqda...</p>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="glass-strong p-6 sm:p-8 max-w-md w-full text-center space-y-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold font-heading">Nimadir noto'g'ri ketdi</h2>
          <p className="text-sm text-muted-foreground">
            Sahifani yuklashda xatolik yuz berdi. Internet aloqangizni tekshiring va qayta urinib ko'ring.
          </p>
          {this.state.error?.message && (
            <p className="text-[10px] text-muted-foreground/70 font-mono bg-muted/30 p-2 rounded-lg break-all">
              {this.state.error.message.slice(0, 200)}
            </p>
          )}
          <div className="flex gap-2 pt-2">
            <button
              onClick={this.handleReload}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Sahifani yangilang
            </button>
            <button
              onClick={this.handleHome}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted text-foreground text-sm font-semibold hover:bg-muted/80 transition-colors"
            >
              <Home className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }
}

export { ErrorBoundary };
export default ErrorBoundary;
