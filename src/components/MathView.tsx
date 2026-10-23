import React, { useMemo } from 'react';
import katex from 'katex';

interface MathViewProps {
  content: string;
  className?: string;
  inline?: boolean;
}

/**
 * Enhanced formula, chemistry notation, and diagram content renderer.
 * Supports:
 * - KaTeX block: $$...$$ or \[...\]
 * - KaTeX inline: $...$ or \(...\)
 * - Chemistry equilibrium symbols: ⇌, →, ⇄, ΔᵣH₂₉₈⁰
 * - Subscript and superscript formatting for common chemical formulas
 * - Embedded base64 images <img>
 */
export const MathView: React.FC<MathViewProps> = ({ content, className = '', inline = false }) => {
  const renderedContent = useMemo(() => {
    if (!content) return '';

    let text = content;

    // Helper to render KaTeX safely
    const renderKatexSafe = (mathStr: string, isDisplayMode: boolean) => {
      try {
        return katex.renderToString(mathStr.trim(), {
          displayMode: isDisplayMode,
          throwOnError: false,
          output: 'htmlAndMathml'
        });
      } catch {
        return `<span class="katex-error text-red-500 font-mono text-xs">${mathStr}</span>`;
      }
    };

    // Pre-normalize common thermodynamic and chemical symbols outside math
    text = text.replace(/Δ\s*r\s*H\s*298\s*0/gi, '$\\Delta_r H^0_{298}$');
    text = text.replace(/Δ\s*r\s*H\s*0\s*298/gi, '$\\Delta_r H^0_{298}$');
    text = text.replace(/ΔrH2980/gi, '$\\Delta_r H^0_{298}$');
    text = text.replace(/(\d+)\s*∘\s*C/g, '$$$1^\\circ\\text{C}$$');

    // Replace block math $$...$$
    text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
      return `<div class="my-2 overflow-x-auto text-center">${renderKatexSafe(math, true)}</div>`;
    });

    // Replace inline math $...$
    text = text.replace(/\$([^$\n]+?)\$/g, (_, math) => {
      return renderKatexSafe(math, false);
    });

    // Replace LaTeX bracket syntax \[ ... \]
    text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
      return `<div class="my-2 overflow-x-auto text-center">${renderKatexSafe(math, true)}</div>`;
    });

    // Replace LaTeX parenthesis syntax \( ... \)
    text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
      return renderKatexSafe(math, false);
    });

    // Format common chemistry equilibrium symbols
    text = text.replace(/&lt;=&gt;/g, '⇌');
    text = text.replace(/&lt;-&gt;/g, '⇄');
    text = text.replace(/-&gt;/g, '→');

    // Convert line breaks \n to <br> if not inside HTML tags
    text = text.replace(/\n/g, '<br/>');

    return text;
  }, [content]);

  const Component = inline ? 'span' : 'div';

  return (
    <Component
      className={`math-rendered break-words leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
};

export default MathView;
