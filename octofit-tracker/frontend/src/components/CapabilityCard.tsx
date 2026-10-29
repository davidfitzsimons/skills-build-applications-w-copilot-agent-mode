import { useEffect, useMemo, useState } from 'react';
import { getJson } from '../api/client.js';

type Props = {
  title: string;
  description: string;
  collectionKey: string;
  emptyMessage: string;
  path: string;
  renderItem: (item: Record<string, unknown>, index: number) => React.ReactNode;
};

export function CapabilityCard({ title, description, collectionKey, emptyMessage, path, renderItem }: Props) {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      setStatus('loading');
      setErrorMessage('');

      try {
        const payload = await getJson<Record<string, unknown>>(path);
        if (!active) return;

        const nextItems = Array.isArray((payload as Record<string, unknown>)[collectionKey])
          ? ((payload as Record<string, unknown>)[collectionKey] as Record<string, unknown>[])
          : [];

        setItems(nextItems);
        setStatus('ready');
      } catch (error) {
        if (!active) return;
        setStatus('error');
        setErrorMessage(error instanceof Error && /unable|unavailable|error/i.test(error.message) ? error.message : 'Unable to load data');
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [collectionKey, path]);

  const content = useMemo(() => {
    if (status === 'loading') {
      return <p role="status">Loading...</p>;
    }

    if (status === 'error') {
      return <p role="alert">{errorMessage || 'Unable to load data'}</p>;
    }

    if (items.length === 0) {
      return <p>{emptyMessage}</p>;
    }

    return <ul className="list-unstyled mb-0">{items.map((item, index) => <li key={index}>{renderItem(item, index)}</li>)}</ul>;
  }, [emptyMessage, errorMessage, items, renderItem, status]);

  return <section className="card h-100"><div className="card-body"><h2 className="h4">{title}</h2><p>{description}</p>{content}</div></section>;
}
