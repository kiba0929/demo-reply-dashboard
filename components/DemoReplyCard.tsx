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

  const methodLabels: Record<string, string> = {
    abstracted: '抽象化',
    delay: '遅延',
    generic: '一般的',
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6 space-y-6">
      {/* Caption */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-700">キャプション</h2>
        <p className="text-gray-800 bg-blue-50 p-4 rounded-lg">
          {data.caption}
        </p>
      </div>

      {/* Replies */}
      <div className="space-y-4">
        {Object.entries(recipientGroups).map(([recipient, replies]) => (
          <div key={recipient} className="border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-xl">
                {recipient === 'professor' && '👨‍🏫'}
                {recipient === 'family' && '👨‍👩‍👧‍👦'}
                {recipient === 'friend' && '🧑‍🤝‍🧑'}
              </span>
              {recipientLabels[recipient] || recipient}
            </h3>
            <div className="space-y-2">
              {replies.map((reply, idx) => (
                <div key={idx} className="bg-gray-50 rounded p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      {methodLabels[reply.method] || reply.method}
                    </span>
                    <span className="text-xs text-gray-500">
                      受信: {reply.message}
                    </span>
                  </div>
                  <p className="text-gray-800 ml-2">
                    {reply.reply}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
