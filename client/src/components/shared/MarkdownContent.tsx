import Markdown from 'react-markdown';

interface Props {
  content: string;
  compact?: boolean;
}

export const MarkdownContent = ({ content, compact }: Props) => {
  return (
    <Markdown
      components={{
        h1: ({ children }) => (
          <p className={`font-bold ${compact ? 'text-sm' : 'text-base'} text-gray-900`}>{children}</p>
        ),
        h2: ({ children }) => (
          <p className={`font-semibold ${compact ? 'text-sm' : 'text-sm'} text-gray-800`}>{children}</p>
        ),
        h3: ({ children }) => (
          <p className={`font-medium text-sm text-gray-800`}>{children}</p>
        ),
        p: ({ children }) => (
          <p className={`${compact ? 'text-xs' : 'text-sm'} text-gray-700 leading-relaxed`}>{children}</p>
        ),
        ul: ({ children }) => (
          <ul className={`${compact ? 'text-xs' : 'text-sm'} text-gray-700 list-disc list-inside space-y-0.5`}>{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className={`${compact ? 'text-xs' : 'text-sm'} text-gray-700 list-decimal list-inside space-y-0.5`}>{children}</ol>
        ),
        li: ({ children }) => <li>{children}</li>,
        strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        code: ({ children }) => (
          <code className="rounded bg-gray-100 px-1 py-0.5 text-xs font-mono text-gray-800">{children}</code>
        ),
      }}
    >
      {content}
    </Markdown>
  );
};
