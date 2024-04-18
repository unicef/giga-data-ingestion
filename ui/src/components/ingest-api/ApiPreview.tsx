import { memo } from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { docco } from "react-syntax-highlighter/dist/esm/styles/hljs";

export function ApiPreview({ preview }: { preview: string }) {
  return (
    <SyntaxHighlighter
      customStyle={{ height: "100%" }}
      showLineNumbers
      language="json"
      style={docco}
    >
      {preview}
    </SyntaxHighlighter>
  );
}

export const MemoizedApiPreview = memo(
  ApiPreview,
  (prev, next) => prev.preview === next.preview,
);
