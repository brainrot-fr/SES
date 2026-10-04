// Template: Entry — presentational Naql content and optional Khulasa.
export default function NaqlEntry({ content, summary }) {
  return (
    <>
      {content}
      {summary ? <NaqlKhulasa content={summary} /> : null}
    </>
  );
}

export function NaqlKhulasa({ content }) {
  return content;
}
