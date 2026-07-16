import React from 'react';

export default function ScrambleText({ text, delay = 0 }) {
  const originalText = text || '';
  
  return (
    <span key={originalText} className="smooth-reveal">
      {originalText.split('').map((char, index) => (
        <span
          key={index}
          className="reveal-char"
          style={{ animationDelay: `${delay + index * 15}ms` }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
}
