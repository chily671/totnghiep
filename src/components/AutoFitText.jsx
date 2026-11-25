"use client";

import { useEffect, useRef, useState } from "react";

export default function AutoFitText({
  children,
  minFontSize = 7,
  maxFontSize = 19,
  className = "",
}) {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [fontSize, setFontSize] = useState(maxFontSize);

  useEffect(() => {
    const container = containerRef.current;
    const text = textRef.current;

    if (!container || !text) return;

    const fitText = () => {
      const availableWidth = container.clientWidth;

      if (!availableWidth) return;

      let size = maxFontSize;

      text.style.fontSize = `${size}px`;

      while (text.scrollWidth > availableWidth && size > minFontSize) {
        size -= 0.5;
        text.style.fontSize = `${size}px`;
      }

      setFontSize(size);
    };

    const observer = new ResizeObserver(fitText);

    observer.observe(container);

    document.fonts.ready.then(fitText);

    fitText();

    return () => observer.disconnect();
  }, [minFontSize, maxFontSize, children]);

  return (
    <span ref={containerRef} className={className}>
      <span
        ref={textRef}
        style={{
          display: "block",
          width: "max-content",
          maxWidth: "none",
          whiteSpace: "nowrap",
          fontSize: `${fontSize}px`,
        }}
      >
        {children}
      </span>
    </span>
  );
}
