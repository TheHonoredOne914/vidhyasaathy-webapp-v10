import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// Same markdown/math pipeline as the reference; raw provider markup stays inert.
export function SaathyMarkdown({ text }: { text: string }) {
  return <div className="saathy-md"><ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false, trust: false }]]} skipHtml components={{
    a: ({ href, children }) => href && /^https?:\/\//i.test(href) && !/youtube\.com\/(results|search)/i.test(href) ? <a href={href} target="_blank" rel="noopener noreferrer">{children}</a> : <span>{children}</span>,
    img: () => null,
  }}>{text}</ReactMarkdown></div>;
}
