export function Logo({ tone = 'onDark' }: { tone?: 'onDark' | 'onLight' }) {
  return (
    <span className={`logo logo-${tone}`}>
      <img src="/img/logo.webp" alt="" width={36} height={36} />
      <span>
        <span className="logo-name">VidhyaSaathy</span>
        <span className="logo-tag">Learning, with you</span>
      </span>
    </span>
  );
}
