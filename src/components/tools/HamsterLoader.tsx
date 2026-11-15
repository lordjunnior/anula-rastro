import "./hamster-loader.css";

/* Carregador da roda de hamster (Uiverse, por Nawsome), usado nos processamentos das ferramentas. */
export function HamsterLoader({ label, size = 10 }: { label: string; size?: number }) {
  return (
    <span className="hl-wrap" role="status" aria-live="polite">
      <span aria-hidden className="wheel-and-hamster" style={{ fontSize: `${size}px` }}>
        <span className="wheel" />
        <span className="hamster">
          <span className="hamster__body">
            <span className="hamster__head">
              <span className="hamster__ear" />
              <span className="hamster__eye" />
              <span className="hamster__nose" />
            </span>
            <span className="hamster__limb hamster__limb--fr" />
            <span className="hamster__limb hamster__limb--fl" />
            <span className="hamster__limb hamster__limb--br" />
            <span className="hamster__limb hamster__limb--bl" />
            <span className="hamster__tail" />
          </span>
        </span>
        <span className="spoke" />
      </span>
      <strong className="hl-label">{label}</strong>
    </span>
  );
}
