import {
  ArrowLeft,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  X,
} from "lucide-react";
import type { SignInState } from "../../shared/contracts";

export default function SteamSignIn({
  state,
  runAction,
}: {
  state: SignInState;
  runAction: (action: string) => Promise<unknown>;
}) {
  return (
    <section
      className="steam-sign-in"
      role="dialog"
      aria-modal="true"
      aria-label="Вход через Steam"
    >
      <header className="sign-in-toolbar">
        <button
          className="icon-button"
          aria-label="Назад"
          disabled={!state.canGoBack}
          onClick={() => void runAction("signInBack").catch(() => {})}
        >
          <ArrowLeft size={18} />
        </button>
        <div className="sign-in-address">
          <LockKeyhole size={14} />
          <span>{state.host}</span>
        </div>
        {state.loading && (
          <LoaderCircle size={17} className="spin" aria-label="Загрузка" />
        )}
        <button
          className="icon-button"
          aria-label="Обновить"
          onClick={() => void runAction("signInRetry").catch(() => {})}
        >
          <RefreshCw size={16} />
        </button>
        <button
          className="ghost sign-in-close"
          onClick={() => void runAction("cancelPair").catch(() => {})}
        >
          <X size={16} />
          Отменить вход
        </button>
      </header>
      {state.error && (
        <div className="sign-in-error" role="alert">
          <p>{state.error}</p>
          <button
            className="secondary"
            onClick={() => void runAction("signInRetry").catch(() => {})}
          >
            Обновить
          </button>
        </div>
      )}
    </section>
  );
}
