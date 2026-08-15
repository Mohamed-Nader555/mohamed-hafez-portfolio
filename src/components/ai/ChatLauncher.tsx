export function ChatLauncher({ onOpen }: { onOpen(): void }) {
  return (
    <button
      className="assistant-launcher"
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
    >
      Ask about Mohamed’s evidence
    </button>
  );
}
