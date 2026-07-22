type Props = { bg: string; fg: string };

export function Divider({ bg, fg }: Props) {
  return (
    <div className="v-divider" style={{ background: bg }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <polygon points="0,0 100,0 50,100" fill={fg} />
      </svg>
    </div>
  );
}
