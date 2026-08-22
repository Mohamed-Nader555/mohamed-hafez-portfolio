export function NeuralGlyph({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <path
        className="neural-path neural-path--cyan"
        d="M8 14 20 8l9 10 11-5"
      />
      <path
        className="neural-path neural-path--magenta"
        d="m8 34 12 5 9-12 11 7"
      />
      <path className="neural-path neural-path--bridge" d="m20 8v31m9-21v9" />
      <circle className="neural-node neural-node--cyan" cx="8" cy="14" r="3" />
      <circle
        className="neural-node neural-node--magenta"
        cx="8"
        cy="34"
        r="3"
      />
      <circle className="neural-node neural-node--cyan" cx="20" cy="8" r="3" />
      <circle
        className="neural-node neural-node--magenta"
        cx="20"
        cy="39"
        r="3"
      />
      <circle
        className="neural-node neural-node--core"
        cx="29"
        cy="22.5"
        r="4.5"
      />
      <circle className="neural-node neural-node--cyan" cx="40" cy="13" r="3" />
      <circle
        className="neural-node neural-node--magenta"
        cx="40"
        cy="34"
        r="3"
      />
    </svg>
  );
}
