import React, { useMemo } from 'react';

// Declaration for KaTeX on window if loaded via CDN
declare global {
  interface Window {
    katex?: {
      renderToString: (
        tex: string,
        options?: { displayMode?: boolean; throwOnError?: boolean }
      ) => string;
    };
  }
}

interface MathRendererProps {
  content: string;
  className?: string;
  inline?: boolean;
}

/**
 * Render nội dung có thể chứa công thức toán học LaTeX:
 *   - Block: $$...$$ → hiển thị giữa dòng, căn giữa
 *   - Inline: $...$ → hiển thị trong dòng chữ
 * Fallback: hiển thị text gốc với font mono nếu KaTeX chưa tải
 */
export const MathRenderer: React.FC<MathRendererProps> = ({
  content,
  className = '',
  inline = false,
}) => {
  // Theo dõi trạng thái KaTeX để trigger re-render khi thư viện tải xong
  const [, setKatexLoaded] = React.useState(0);

  // Load KaTeX script động nếu chưa có trên window (CDN chưa sẵn)
  React.useEffect(() => {
    if (typeof window !== 'undefined' && !window.katex) {
      // Kiểm tra xem script đã được thêm chưa để tránh thêm 2 lần
      const existingScript = document.querySelector(
        'script[src*="katex"][src*="katex.min.js"]'
      );
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
        script.crossOrigin = 'anonymous';
        script.async = true;
        script.onload = () => {
          window.dispatchEvent(new Event('katex-loaded'));
        };
        document.head.appendChild(script);
      }
    } else if (typeof window !== 'undefined' && window.katex) {
      // KaTeX đã có sẵn (tải từ CDN trong index.html) → trigger re-render ngay
      setKatexLoaded((n) => n + 1);
    }
  }, []);

  // Lắng nghe sự kiện KaTeX đã tải xong để re-render nội dung
  React.useEffect(() => {
    const handleLoaded = () => setKatexLoaded((n) => n + 1);
    window.addEventListener('katex-loaded', handleLoaded);
    return () => window.removeEventListener('katex-loaded', handleLoaded);
  }, []);

  const { renderedHtml, hasBlockMath } = useMemo(() => {
    if (!content) return { renderedHtml: '', hasBlockMath: false };

    let foundBlock = false;
    // Tách nội dung theo block math ($$...$$) và inline math ($...$)
    const parts = content.split(/(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)/g);

    const html = parts
      .map((part) => {
        if (!part) return '';

        // Block display math: $$...$$
        if (part.startsWith('$$') && part.endsWith('$$') && part.length > 4) {
          foundBlock = true;
          const tex = part.slice(2, -2).trim();
          if (typeof window !== 'undefined' && window.katex) {
            try {
              return `<div class="katex-block my-3 py-1 text-center overflow-x-auto">${window.katex.renderToString(
                tex,
                { displayMode: true, throwOnError: false }
              )}</div>`;
            } catch {
              return `<div class="font-mono text-indigo-300 text-center bg-indigo-950/30 rounded p-2">${part}</div>`;
            }
          }
          // KaTeX chưa tải → hiển thị raw text
          return `<div class="font-mono text-indigo-300 text-center bg-indigo-950/30 rounded p-2">${part}</div>`;
        }

        // Inline math: $...$
        if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
          const tex = part.slice(1, -1).trim();
          if (typeof window !== 'undefined' && window.katex) {
            try {
              return window.katex.renderToString(tex, {
                displayMode: false,
                throwOnError: false,
              });
            } catch {
              return `<span class="font-mono text-indigo-300">${part}</span>`;
            }
          }
          return `<span class="font-mono text-indigo-300">${part}</span>`;
        }

        // Văn bản thường — escape HTML để tránh XSS
        return part
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br/>');
      })
      .join('');

    return { renderedHtml: html, hasBlockMath: foundBlock };
  }, [content]);

  // Nếu có block math → dùng div để tránh invalid HTML (div trong span)
  if (hasBlockMath) {
    return (
      <div
        className={`math-content ${className}`}
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    );
  }

  return (
    <span
      className={`math-content ${inline ? 'inline' : 'inline-block'} ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};
