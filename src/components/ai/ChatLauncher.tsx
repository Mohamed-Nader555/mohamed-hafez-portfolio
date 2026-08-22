import { NeuralGlyph } from './NeuralGlyph';

export function ChatLauncher({ onOpen }: { onOpen(): void }) {
  return (
    <button
      className="assistant-launcher"
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-label="Open Mohamed AI portfolio assistant"
    >
      <span className="launcher-glyph" aria-hidden="true">
        <NeuralGlyph />
      </span>
      <span className="launcher-copy">
        <span className="launcher-kicker">
          <span className="launcher-status-dot" aria-hidden="true" />
          Grounded AI
        </span>
        <strong>Ask Mohamed.AI</strong>
      </span>
      <span className="launcher-arrow" aria-hidden="true">
        ↗
      </span>
    </button>
  );
}
