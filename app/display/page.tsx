'use client';

import { useEffect, useRef, useState } from 'react';

interface PlaylistItem {
  videoFile: string;
  documentId: string;
}

type Mode = 'realtime' | 'demo';

export default function DisplayPage() {
  const [mode, setMode] = useState<Mode>('realtime');

  // Realtime mode state
  const [videoList, setVideoList] = useState<string[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  // Demo mode state
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playKey, setPlayKey] = useState(0);

  // Generate state
  const [generating, setGenerating] = useState(false);

  const channelRef = useRef<BroadcastChannel | null>(null);

  // BroadcastChannel setup
  useEffect(() => {
    const channel = new BroadcastChannel('demo-reply-channel');
    channelRef.current = channel;
    channel.onmessage = (e) => {
      if (e.data.type === 'modeChange') setMode(e.data.mode);
    };
    return () => channel.close();
  }, []);

  // Fetch video list for realtime mode
  useEffect(() => {
    fetch('/api/videos')
      .then((r) => r.json())
      .then((files: string[]) => {
        setVideoList(files);
        if (files.length > 0) setSelectedVideo(files[0]);
      })
      .catch((e) => console.error('Failed to fetch video list:', e));
  }, []);

  // Fetch playlist for demo mode
  useEffect(() => {
    fetch('/demo-playlist.json')
      .then((r) => r.json())
      .then((items: PlaylistItem[]) => setPlaylist(items))
      .catch((e) => console.error('Failed to fetch playlist:', e));
  }, []);

  // When mode switches to demo, reset index and broadcast immediately
  useEffect(() => {
    if (mode === 'demo') {
      setCurrentIndex(0);
      setPlayKey(0);
      channelRef.current?.postMessage({ type: 'indexChange', index: 0 });
    }
  }, [mode]);

  const handleDemoVideoEnded = () => {
    if (playlist.length === 0) return;
    const next = (currentIndex + 1) % playlist.length;
    setCurrentIndex(next);
    setPlayKey((k) => k + 1);
    channelRef.current?.postMessage({ type: 'indexChange', index: next });
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    channelRef.current?.postMessage({ type: 'modeChange', mode: next });
  };

  const currentVideoFileName = mode === 'realtime'
    ? selectedVideo
    : playlist.length > 0
      ? playlist[currentIndex].videoFile
      : null;

  const handleGenerateReply = async () => {
    if (!currentVideoFileName || generating) return;

    setGenerating(true);
    channelRef.current?.postMessage({ type: 'generating' });

    try {
      const res = await fetch('/api/generate-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoFileName: currentVideoFileName }),
      });

      if (!res.ok) throw new Error('API error');

      const data = await res.json();
      channelRef.current?.postMessage({ type: 'generatedReplies', data });
    } catch (error) {
      console.error('Failed to generate reply:', error);
      channelRef.current?.postMessage({ type: 'generateError' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex">

      {/* ── Left sidebar (always visible) ── */}
      <div className="w-72 bg-gray-900/95 flex flex-col gap-6 p-6 flex-shrink-0 overflow-y-auto">
        {/* Mode toggle */}
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">モード</p>
          <div className="flex gap-2">
            <button
              onClick={() => switchMode('realtime')}
              className={`flex-1 py-2 rounded font-medium text-sm transition-colors ${
                mode === 'realtime'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              リアルタイム
            </button>
            <button
              onClick={() => switchMode('demo')}
              className={`flex-1 py-2 rounded font-medium text-sm transition-colors ${
                mode === 'demo'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              デモ
            </button>
          </div>
        </div>

        {/* Video list (realtime only) */}
        {mode === 'realtime' && (
          <div className="flex flex-col gap-1 overflow-y-auto flex-1">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">動画を選択</p>
            {videoList.length === 0 && (
              <p className="text-gray-500 text-sm">動画が見つかりません</p>
            )}
            {videoList.map((file) => (
              <button
                key={file}
                onClick={() => setSelectedVideo(file)}
                className={`text-left px-3 py-2 rounded text-sm truncate transition-colors ${
                  selectedVideo === file
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {selectedVideo === file ? '▶ ' : ''}
                {file}
              </button>
            ))}
          </div>
        )}

        {/* Demo playlist info */}
        {mode === 'demo' && playlist.length > 0 && (
          <div className="flex flex-col gap-1 overflow-y-auto flex-1">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">プレイリスト</p>
            {playlist.map((item, i) => (
              <div
                key={i}
                className={`px-3 py-2 rounded text-sm truncate ${
                  i === currentIndex
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-500'
                }`}
              >
                {i === currentIndex ? '▶ ' : `${i + 1}. `}
                {item.videoFile}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Video area ── */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        {mode === 'realtime' ? (
          selectedVideo ? (
            <video
              key={selectedVideo}
              src={`/videos/${selectedVideo}`}
              autoPlay
              muted
              playsInline
              loop
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <p className="text-gray-500">動画を選択してください</p>
          )
        ) : (
          playlist.length > 0 ? (
            <video
              key={playKey}
              src={`/videos/${playlist[currentIndex].videoFile}`}
              autoPlay
              muted
              playsInline
              onEnded={handleDemoVideoEnded}
              className="w-full h-full object-contain"
            />
          ) : (
            <p className="text-gray-500">プレイリストを読み込み中...</p>
          )
        )}

        {/* Generate button */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <button
            onClick={handleGenerateReply}
            disabled={generating || !currentVideoFileName}
            className={`px-8 py-3 rounded-full font-semibold text-sm shadow-lg transition-all ${
              generating
                ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-500 hover:shadow-xl active:scale-95'
            }`}
          >
            {generating ? '生成中...' : '返信を生成'}
          </button>
        </div>
      </div>
    </div>
  );
}
