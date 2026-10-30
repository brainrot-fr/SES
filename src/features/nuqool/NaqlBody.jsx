function Quote({ children }) {
  return <blockquote className="naql-quote">{children}</blockquote>;
}

export default function NaqlBody({ entry }) {
  if (!entry) throw new Error("NaqlBody requires a valid Naql entry");

  return (
    <div className="naql-content">
      {entry.parts.map((part, index) => {
        const key = `${part.type}-${index}`;
        if (part.type === "quote") {
          return <Quote key={key}><p>{part.text}</p></Quote>;
        }
        if (part.type === "ayah") {
          return <div key={key} className="quran" lang="ar" dir="rtl">{part.text}</div>;
        }
        if (part.type === "hadith") {
          return <div key={key} className="hadees" lang="ar" dir="rtl">{part.text}</div>;
        }
        return <p key={key} className="naql-paragraph">{part.text}</p>;
      })}
      {entry.sources.length > 0 && (
        <cite>
          {entry.sources.map((source, index) => <span key={`${index}-${source}`}>{source}</span>)}
        </cite>
      )}
    </div>
  );
}
