export function ChatSuggestions({
  suggestions,
  onChoose,
}: {
  suggestions: string[];
  onChoose(value: string): void;
}) {
  return (
    <div className="chat-suggestions" aria-label="Suggested questions">
      {suggestions.map((suggestion) => (
        <button
          type="button"
          key={suggestion}
          onClick={() => onChoose(suggestion)}
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
