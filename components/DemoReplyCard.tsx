import { DemoReplyDocument } from '@/lib/types';

interface DemoReplyCardProps {
  data: DemoReplyDocument;
}

export default function DemoReplyCard({ data }: DemoReplyCardProps) {
  const recipientGroups = data.replies.reduce((acc, reply) => {
    if (!acc[reply.recipient]) {
      acc[reply.recipient] = [];
    }
    acc[reply.recipient].push(reply);
    return acc;
  }, {} as Record<string, typeof data.replies>);

  const recipientLabels: Record<string, string> = {
    professor: '心理的距離が遠い（例：怖い上司）',
    family: '心理的距離が中程度（例：そこそこの仲の同僚）',
    friend: '心理的距離が近い（例：親友）',
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8 space-y-6">
      {/* Caption */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-600 mb-2">
          キャプション
        </h3>
        <p className="text-gray-700 whitespace-pre-line">{data.caption}</p>
      </div>

      {/* Replies */}
      <div className="space-y-6">
        {Object.entries(recipientGroups).map(([recipient, replies]) => (
          <div key={recipient} className="bg-gray-50 rounded-lg p-6">
            {/* Chat header */}
            <div className="flex items-center gap-3 mb-4 bg-blue-600 rounded-lg p-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-white text-lg">
                    {recipientLabels[recipient] || recipient}
                  </span>
                </div>
              </div>
            </div>

            {/* Chat messages */}
            <div className="space-y-4">
              {replies.map((reply, idx) => (
                <div key={idx} className="space-y-4">
                  {/* Incoming message */}
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-2 max-w-md">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                        👤
                      </div>
                      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                        <p className="text-gray-800">{reply.message}</p>
                      </div>
                    </div>
                  </div>

                  {/* Outgoing reply */}
                  <div className="flex justify-end">
                    <div className="flex items-start space-x-2 max-w-md">
                      <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
                        <p>{reply.reply}</p>
                      </div>
                      <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                        <span className="text-white text-xs">You</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
