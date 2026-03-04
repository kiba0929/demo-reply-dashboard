'use client';

import { useEffect, useState } from 'react';
import { getDemoReplyById } from '@/lib/firestore';
import { DemoReplyDocument } from '@/lib/types';
import DemoReplyCard from '@/components/DemoReplyCard';
import ChatColumn from '@/components/ChatColumn';
import LoadingState from '@/components/LoadingState';
import EmptyState from '@/components/EmptyState';

interface PlaylistItem {
  videoFile: string;
  documentId: string;
}

interface GeneratedReply {
  recipient: string;
  message: string;
  reply: string;
  method: string;
}

interface GeneratedData {
  caption: string;
  category: string;
  isInCategory: boolean;
  replies: GeneratedReply[];
}

type Mode = 'realtime' | 'demo';

const CHAT_COLUMNS = [
  {
    recipient: 'friend',
    label: '心理的距離が近い',
    placeholder: 'なんでも共有できる親友',
  },
  {
    recipient: 'family',
    label: '心理的距離が中程度',
    placeholder: 'そこまで仲が良くも悪くもない同僚',
  },
  {
    recipient: 'professor',
    label: '心理的距離が遠い',
    placeholder: '厳しい上司',
  },
] as const;

export default function Home() {
  const [mode, setMode] = useState<Mode>('realtime');

  // Realtime mode state
  const [data, setData] = useState<DemoReplyDocument | null>(null);
  const [loading, setLoading] = useState(true);

  // Demo mode state
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [demoData, setDemoData] = useState<DemoReplyDocument | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);

  // Generated replies state
  const [generatedData, setGeneratedData] = useState<GeneratedData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(false);

  // Fetch playlist once
  useEffect(() => {
    fetch('/demo-playlist.json')
      .then((r) => r.json())
      .then((items: PlaylistItem[]) => setPlaylist(items))
      .catch((e) => console.error('Failed to fetch playlist:', e));
  }, []);

  // Realtime mode: no initial Firestore fetch needed

  // BroadcastChannel: always-on
  useEffect(() => {
    const channel = new BroadcastChannel('demo-reply-channel');
    channel.onmessage = (e) => {
      if (e.data.type === 'modeChange') setMode(e.data.mode);
      if (e.data.type === 'indexChange') setCurrentIndex(e.data.index);
      if (e.data.type === 'generating') {
        setIsGenerating(true);
        setGeneratedData(null);
        setGenerateError(false);
      }
      if (e.data.type === 'generatedReplies') {
        setGeneratedData(e.data.data);
        setIsGenerating(false);
        setGenerateError(false);
      }
      if (e.data.type === 'generateError') {
        setIsGenerating(false);
        setGenerateError(true);
      }
    };
    return () => channel.close();
  }, []);

  // Demo mode: fetch doc when index changes
  useEffect(() => {
    if (mode !== 'demo' || playlist.length === 0 || currentIndex >= playlist.length) return;
    setDemoLoading(true);
    getDemoReplyById(playlist[currentIndex].documentId)
      .then((doc) => {
        setDemoData(doc);
        setDemoLoading(false);
      })
      .catch((e) => {
        console.error('Failed to fetch demo reply:', e);
        setDemoLoading(false);
      });
  }, [mode, currentIndex, playlist]);

  const currentData = mode === 'realtime' ? data : demoData;
  const currentLoading = mode === 'realtime' ? loading : demoLoading;

  // Check if we should show the generated chat columns
  const showChatColumns = isGenerating || generatedData !== null || generateError;
  // In realtime mode, always show ChatColumns (initially in waiting state)
  const showRealtimeWaiting = mode === 'realtime' && !showChatColumns;

  function getReplyForRecipient(recipient: string): GeneratedReply | undefined {
    return generatedData?.replies.find((r) => r.recipient === recipient);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-screen-xl mx-auto px-8 py-12">
        {showChatColumns || showRealtimeWaiting ? (
          /* 3 ChatColumns side by side */
          <div className="flex gap-4">
            {CHAT_COLUMNS.map((col) => {
              const replyData = getReplyForRecipient(col.recipient);
              return (
                <ChatColumn
                  key={col.recipient}
                  recipientLabel={col.label}
                  placeholderName={col.placeholder}
                  message={replyData?.message}
                  reply={replyData?.reply}
                  loading={isGenerating}
                  waiting={showRealtimeWaiting}
                />
              );
            })}
          </div>
        ) : currentLoading ? (
          <LoadingState />
        ) : currentData ? (
          <DemoReplyCard data={currentData} />
        ) : (
          <EmptyState />
        )}

        {generateError && !isGenerating && (
          <div className="mt-4 text-center">
            <p className="text-red-500 text-sm">
              返信の生成に失敗しました。もう一度お試しください。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
