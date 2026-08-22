export function ChatSuggestions({
  suggestions,
  onChoose,
}: {
  suggestions: string[];
  onChoose(value: string): void;
}) {
  return (
    <section className="chat-suggestion-group" aria-label="Suggested questions">
      <p>Suggested queries</p>
      <div className="chat-suggestions">
        {suggestions.map((suggestion) => (
          <button
            type="button"
            key={suggestion}
            onClick={() => onChoose(suggestion)}
          >
            <span>{suggestion}</span>
            <span aria-hidden="true">↗</span>
          </button>
        ))}
      </div>
    </section>
  );
}
