'use client';

import React from 'react';

interface LinkifiedTextProps {
  text: string;
}

export const LinkifiedText: React.FC<LinkifiedTextProps> = ({ text }) => {
  const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  const urlRegex = /(?<!]\()https?:\/\/[^\s)]+/g;

  const elements: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match;

  // First pass for markdown links
  while ((match = markdownLinkRegex.exec(text)) !== null) {
    const [fullMatch, linkText, url] = match;
    const precedingText = text.substring(lastIndex, match.index);
    if (precedingText) {
      elements.push(precedingText);
    }
    elements.push(
      <a
        key={`md-${match.index}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 underline hover:text-blue-600"
        onClick={(e) => e.stopPropagation()}
      >
        {linkText}
      </a>
    );
    lastIndex = markdownLinkRegex.lastIndex;
  }

  const remainingText = text.substring(lastIndex);
  elements.push(remainingText);

  // Second pass for raw URLs on the text parts
  const finalElements = elements.flatMap((part, index) => {
    if (typeof part === 'string') {
      const urlParts: (string | JSX.Element)[] = [];
      let lastUrlIndex = 0;
      let urlMatch;
      while ((urlMatch = urlRegex.exec(part)) !== null) {
        const preceding = part.substring(lastUrlIndex, urlMatch.index);
        if (preceding) {
          urlParts.push(preceding);
        }
        urlParts.push(
          <a
            key={`url-${index}-${urlMatch.index}`}
            href={urlMatch[0]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline hover:text-blue-600"
            onClick={(e) => e.stopPropagation()}
          >
            {urlMatch[0]}
          </a>
        );
        lastUrlIndex = urlRegex.lastIndex;
      }
      const remaining = part.substring(lastUrlIndex);
      if (remaining) {
        urlParts.push(remaining);
      }
      return urlParts;
    }
    return part;
  });

  return <>{finalElements}</>;
};
