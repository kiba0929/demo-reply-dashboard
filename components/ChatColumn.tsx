interface ChatColumnProps {
  recipientLabel: string;
  placeholderName: string;
  message?: string;
  reply?: string;
  loading: boolean;
  waiting?: boolean;
}

export default function ChatColumn({
  recipientLabel,
  placeholderName,
  message,
  reply,
  loading,
  waiting,
}: ChatColumnProps) {
  return (
    <div className="flex-1 bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 px-4 py-3">
        <h2 className="text-white font-semibold text-sm text-center">
          {recipientLabel}
        </h2>
      </div>

      {/* Body */}
      <div className="flex-1 p-4 flex flex-col justify-center">
        {waiting ? (
          /* Initial waiting state */
          <div className="text-center space-y-4">
            <p className="text-gray-600 text-sm">
              {recipientLabel}の相手を想像して下さい。
            </p>
            <p className="text-gray-400 text-xs">
              例: {placeholderName}
            </p>
          </div>
        ) : loading ? (
          /* Placeholder during generation */
          <div className="text-center space-y-4">
            <p className="text-gray-600 text-sm">
              {recipientLabel}の相手を想像して下さい。
            </p>
            <p className="text-gray-400 text-xs">
              例: {placeholderName}
            </p>
            <div className="flex justify-center">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        ) : message && reply ? (
          /* Chat bubbles */
          <div className="space-y-4">
            {/* Incoming message (left) */}
            <div className="flex justify-start">
              <div className="flex items-start space-x-2 max-w-[85%]">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                  <span role="img" aria-label="user">👤</span>
                </div>
                <div className="bg-gray-100 border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3">
                  <p className="text-gray-800 text-sm">{message}</p>
                </div>
              </div>
            </div>

            {/* Outgoing reply (right) */}
            <div className="flex justify-end">
              <div className="flex items-start space-x-2 max-w-[85%]">
                <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-3">
                  <p className="text-sm">{reply}</p>
                </div>
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs">You</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              返信を生成してください
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
