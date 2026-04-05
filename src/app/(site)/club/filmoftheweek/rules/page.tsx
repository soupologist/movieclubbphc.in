'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ReactMarkdown, { type Components } from 'react-markdown';
import { instrumentSerif } from '@/app/fonts';

interface RulesResponse {
  content: string;
  updatedAt?: string | null;
  updatedBy?: string | null;
}

export default function FOTWRulesPage() {
  const [rules, setRules] = useState<RulesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const loadRules = async () => {
      setLoading(true);
      setHasError(false);
      try {
        const res = await fetch('/api/fotw/rules');
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Failed to load rules');
        setRules({
          content: data.content || '',
          updatedAt: data.updatedAt || null,
          updatedBy: data.updatedBy || null,
        });
      } catch (error) {
        setHasError(true);
      } finally {
        setLoading(false);
      }
    };

    loadRules();
  }, []);

  const updatedLabel = useMemo(() => {
    if (!rules?.updatedAt) return '-';
    const date = new Date(rules.updatedAt);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [rules?.updatedAt]);

  const markdownComponents = useMemo<Components>(
    () => ({
      h1: ({ children }) => (
        <h1
          className={instrumentSerif.className}
          style={{ color: 'white', marginTop: 24, fontSize: '1.8rem' }}
        >
          {children}
        </h1>
      ),
      h2: ({ children }) => (
        <h2
          className={instrumentSerif.className}
          style={{ color: 'white', marginTop: 24, fontSize: '1.6rem' }}
        >
          {children}
        </h2>
      ),
      h3: ({ children }) => (
        <h3
          className={instrumentSerif.className}
          style={{ color: 'white', marginTop: 24, fontSize: '1.3rem' }}
        >
          {children}
        </h3>
      ),
      p: ({ children }) => (
        <p style={{ color: '#8a9bb0', lineHeight: 1.8, fontSize: 15 }}>{children}</p>
      ),
      ul: ({ children }) => (
        <ul style={{ color: '#8a9bb0', paddingLeft: 20, lineHeight: 2 }}>{children}</ul>
      ),
      ol: ({ children }) => (
        <ol style={{ color: '#8a9bb0', paddingLeft: 20, lineHeight: 2 }}>{children}</ol>
      ),
      li: ({ children }) => <li style={{ marginBottom: 4 }}>{children}</li>,
      strong: ({ children }) => <strong style={{ color: 'white' }}>{children}</strong>,
      hr: () => <hr style={{ borderColor: '#1e1e1e', margin: '24px 0' }} />,
      code: ({ children }) => (
        <code
          style={{
            background: '#141414',
            border: '1px solid #1e1e1e',
            borderRadius: 4,
            padding: '2px 6px',
            color: '#00e054',
            fontSize: 13,
          }}
        >
          {children}
        </code>
      ),
    }),
    []
  );

  return (
    <div
      style={{
        backgroundColor: '#000000',
        minHeight: '100vh',
        padding: '40px 24px',
      }}
    >
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <header>
          <Link href="/club/filmoftheweek" style={{ color: '#40bcf4', fontSize: 13 }}>
            ← Film of the Week
          </Link>
          <h1
            className={instrumentSerif.className}
            style={{ fontSize: '2.5rem', color: 'white', marginTop: 16 }}
          >
            Rules
          </h1>
          <p style={{ color: '#4a5568', fontSize: 12, marginTop: 6 }}>
            Last updated: {updatedLabel}
          </p>
        </header>

        {loading ? (
          <div style={{ color: '#4a5568', textAlign: 'center', marginTop: 80 }}>
            Loading rules...
          </div>
        ) : hasError ? (
          <div style={{ color: '#4a5568', textAlign: 'center', marginTop: 80 }}>
            Rules not available.
          </div>
        ) : (
          <div style={{ marginTop: 24 }}>
            <ReactMarkdown components={markdownComponents}>{rules?.content || ''}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
