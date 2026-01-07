export interface DemoReply {
  recipient: string;
  message: string;
  reply: string;
  method: string;
}

export interface DemoReplyDocument {
  id: string;
  videoFilePath: string;
  videoFileName: string;
  caption: string;
  category: string;
  isInCategory: boolean;
  replies: DemoReply[];
  timestamp: Date | null;
  createdAt: Date | null;
}
