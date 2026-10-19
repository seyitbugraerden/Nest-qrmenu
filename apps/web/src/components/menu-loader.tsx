type MenuLoaderProps = { onSkip?: () => void; intro?: boolean };

export default function MenuLoader({ onSkip, intro = false }: MenuLoaderProps) {
  return (
    <div className={`loading-screen ${intro ? "loading-intro" : ""}`}>
      <div className="loading-center" role="status" aria-live="polite">
        <div className="loading-emblem" aria-hidden="true">
          <span />
          <span />
          <b>n.</b>
        </div>
        <p className="loading-wordmark">
          nest<span>®</span>
        </p>
        <p className="loading-caption">
          {intro ? "Güzel bir mola başlıyor." : "Menü yükleniyor…"}
        </p>
        <div className="loading-track" aria-hidden="true">
          <span />
        </div>
      </div>
      {onSkip && (
        <button type="button" className="skip-intro" onClick={onSkip}>
          Menüye geç ↗
        </button>
      )}
      <span className="loading-edition">COFFEE, FOOD & GOOD MOOD.</span>
    </div>
  );
}
