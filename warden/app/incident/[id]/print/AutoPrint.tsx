'use client';

/**
 * Opens the print dialog once the document has painted, and marks the html
 * element so print.css can undo the dark theme the root layout applies.
 *
 * Chrome's print preview is itself a good visual: a document materialising in a
 * preview pane reads as a document being filed.
 */

import { useEffect, useState } from 'react';

export default function AutoPrint({ auto }: { auto: boolean }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('wd-print');
    setReady(true);
    if (!auto) return;
    // One frame after paint, so images are laid out before the dialog snapshots.
    const t = setTimeout(() => window.print(), 450);
    return () => clearTimeout(t);
  }, [auto]);

  return (
    <div className="print-bar">
      <button onClick={() => window.print()} disabled={!ready}>
        PRINT / SAVE AS PDF
      </button>
      <div style={{ marginTop: 9 }}>
        In the print dialog, uncheck &ldquo;Headers and footers&rdquo; so the page margins carry no
        browser URL. The setting persists.
      </div>
    </div>
  );
}
