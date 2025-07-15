'use client'
import dynamic from 'next/dynamic';
import { useEffect } from 'react';

const DevTools = dynamic(
  async () => {
    if (process.env.NODE_ENV === 'development') {
      const mod = await import('jotai-devtools');
      return mod.DevTools;
    }
    return () => null;
  },
  { ssr: false }
);

export default function JotaiDevtools() {
    useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
        // @ts-ignore
        import('jotai-devtools/styles.css');
    }
    }, []);


  return <DevTools />;
}
