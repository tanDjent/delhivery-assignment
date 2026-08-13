import { useState } from 'react'

interface CodeBlockProps {
  code: string
  /** Compact block used for short one-liners such as the import statement. */
  inline?: boolean
}

export function CodeBlock({ code, inline = false }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard is unavailable over plain HTTP or without permission; the
      // code stays selectable so the user can copy it manually.
    }
  }

  return (
    <div className={`code${inline ? ' code--inline' : ''}`}>
      <pre className="code__pre">
        <code>{code}</code>
      </pre>
      <button type="button" className="code__copy" onClick={copy}>
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}
