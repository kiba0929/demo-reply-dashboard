'use client';

import { useEffect, useState } from 'react';
import { subscribeToLatestDemoReply } from '@/lib/firestore';
import { DemoReplyDocument } from '@/lib/types';
import DemoReplyCard from '@/components/DemoReplyCard';
import LoadingState from '@/components/LoadingState';
import EmptyState from '@/components/EmptyState';

export default function Home() {
  const [data, setData] = useState<DemoReplyDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToLatestDemoReply((newData) => {
      setData(newData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {loading ? (
          <LoadingState />
        ) : data ? (
          <DemoReplyCard data={data} />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}
