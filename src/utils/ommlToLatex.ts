/**
 * Converts Microsoft Word OMML (Office Math Markup Language) to standard KaTeX LaTeX.
 * Handles fractions, sub/superscripts, radicals, brackets, symbols and chemistry notation.
 */

export function convertOmmlElementToLatex(node: Element): string {
  const tagName = node.localName || node.nodeName.replace(/^.*:/, '');

  switch (tagName) {
    case 'oMath':
    case 'oMathPara': {
      let result = '';
      for (let i = 0; i < node.children.length; i++) {
        result += convertOmmlElementToLatex(node.children[i]);
      }
      return result.trim();
    }

    case 'f': {
      // Fraction: <m:f><m:num>...</m:num><m:den>...</m:den></m:f>
      let num = '';
      let den = '';
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        const childTag = child.localName || child.nodeName.replace(/^.*:/, '');
        if (childTag === 'num') {
          num = convertOmmlElementToLatex(child);
        } else if (childTag === 'den') {
          den = convertOmmlElementToLatex(child);
        }
      }
      return `\\frac{${num || '1'}}{${den || '1'}}`;
    }

    case 'sSub': {
      // Subscript: <m:sSub><m:e>base</m:e><m:sub>sub</m:sub></m:sSub>
      let base = '';
      let sub = '';
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        const childTag = child.localName || child.nodeName.replace(/^.*:/, '');
        if (childTag === 'e') {
          base = convertOmmlElementToLatex(child);
        } else if (childTag === 'sub') {
          sub = convertOmmlElementToLatex(child);
        }
      }
      return `${base}_{${sub}}`;
    }

    case 'sSup': {
      // Superscript: <m:sSup><m:e>base</m:e><m:sup>sup</m:sup></m:sSup>
      let base = '';
      let sup = '';
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        const childTag = child.localName || child.nodeName.replace(/^.*:/, '');
        if (childTag === 'e') {
          base = convertOmmlElementToLatex(child);
        } else if (childTag === 'sup') {
          sup = convertOmmlElementToLatex(child);
        }
      }
      return `${base}^{${sup}}`;
    }

    case 'sSubSup': {
      // Subscript and Superscript: <m:sSubSup><m:e>...</m:e><m:sub>...</m:sub><m:sup>...</m:sup></m:sSubSup>
      let base = '';
      let sub = '';
      let sup = '';
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        const childTag = child.localName || child.nodeName.replace(/^.*:/, '');
        if (childTag === 'e') {
          base = convertOmmlElementToLatex(child);
        } else if (childTag === 'sub') {
          sub = convertOmmlElementToLatex(child);
        } else if (childTag === 'sup') {
          sup = convertOmmlElementToLatex(child);
        }
      }
      return `${base}_{${sub}}^{${sup}}`;
    }

    case 'rad': {
      // Radical: <m:rad><m:radPr><m:deg>3</m:deg></m:radPr><m:e>base</m:e></m:rad>
      let deg = '';
      let base = '';
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        const childTag = child.localName || child.nodeName.replace(/^.*:/, '');
        if (childTag === 'deg') {
          deg = convertOmmlElementToLatex(child);
        } else if (childTag === 'e') {
          base = convertOmmlElementToLatex(child);
        }
      }
      return deg ? `\\sqrt[${deg}]{${base}}` : `\\sqrt{${base}}`;
    }

    case 'd': {
      // Delimiters (brackets, parenthesis): <m:d><m:dPr>...</m:dPr><m:e>...</m:e></m:d>
      let begChar = '(';
      let endChar = ')';
      let content = '';

      const dPr = Array.from(node.children).find(
        (c) => (c.localName || c.nodeName.replace(/^.*:/, '')) === 'dPr'
      );
      if (dPr) {
        const begAttr = dPr.querySelector('begChr')?.getAttribute('m:val');
        const endAttr = dPr.querySelector('endChr')?.getAttribute('m:val');
        if (begAttr !== null && begAttr !== undefined) begChar = begAttr;
        if (endAttr !== null && endAttr !== undefined) endChar = endAttr;
      }

      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        const childTag = child.localName || child.nodeName.replace(/^.*:/, '');
        if (childTag === 'e') {
          content += convertOmmlElementToLatex(child);
        }
      }

      if (begChar === '[' && endChar === ']') {
        return `[${content}]`;
      } else if (begChar === '{' && endChar === '}') {
        return `\\{${content}\\}`;
      } else if (begChar === '(' && endChar === ')') {
        return `(${content})`;
      } else if (begChar === '|' && endChar === '|') {
        return `|${content}|`;
      }
      return `${begChar}${content}${endChar}`;
    }

    case 'bar': {
      let content = '';
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if ((child.localName || child.nodeName.replace(/^.*:/, '')) === 'e') {
          content += convertOmmlElementToLatex(child);
        }
      }
      return `\\overline{${content}}`;
    }

    case 'r': {
      // Text run: contains <m:t>
      let text = '';
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        const childTag = child.localName || child.nodeName.replace(/^.*:/, '');
        if (childTag === 't') {
          text += child.textContent || '';
        }
      }

      // Convert common symbols
      text = text.replace(/⇌/g, ' \\rightleftharpoons ');
      text = text.replace(/→/g, ' \\rightarrow ');
      text = text.replace(/⇄/g, ' \\rightleftarrows ');
      text = text.replace(/Δ/g, ' \\Delta ');
      text = text.replace(/⋅/g, ' \\cdot ');
      text = text.replace(/×/g, ' \\times ');
      text = text.replace(/≈/g, ' \\approx ');
      text = text.replace(/∘C/g, '^\\circ\\text{C}');
      text = text.replace(/∘/g, '^\\circ ');
      return text;
    }

    case 't': {
      return node.textContent || '';
    }

    default: {
      let res = '';
      for (let i = 0; i < node.children.length; i++) {
        res += convertOmmlElementToLatex(node.children[i]);
      }
      if (!res && node.textContent) {
        res = node.textContent;
      }
      return res;
    }
  }
}

/**
 * Converts a raw OMML XML block string into a LaTeX formula string wrapped in $...$
 */
export function convertOmmlXmlToLatex(ommlXmlString: string): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<root xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">${ommlXmlString}</root>`, 'text/xml');
    const oMathNodes = doc.querySelectorAll('oMath, oMathPara');
    
    if (oMathNodes.length === 0) {
      return '';
    }

    const latexChunks: string[] = [];
    oMathNodes.forEach((node) => {
      const latex = convertOmmlElementToLatex(node).trim();
      if (latex) {
        latexChunks.push(latex);
      }
    });

    return latexChunks.map((c) => `$${c}$`).join(' ');
  } catch (err) {
    console.warn('Failed to parse OMML XML to LaTeX:', err);
    return '';
  }
}
