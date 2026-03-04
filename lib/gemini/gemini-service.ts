import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  ACTION_RECOGNITION_PROMPT,
  buildActivityCategorizationPrompt,
  buildAbstractionPrompt,
  buildReplyFromAbstractionPrompt,
  buildDelayAbstractionPrompt,
  buildDelayReplyFromAbstractionPrompt,
  RECIPIENT_MESSAGES,
  RecipientType,
} from './prompts';

// ===== クライアント初期化 =====

function getGenAI(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY が設定されていません');
  }
  return new GoogleGenerativeAI(apiKey);
}

const MODEL_FLASH = 'gemini-3-flash-preview';
const MODEL_FLASH_LITE = 'gemini-3.1-flash-lite-preview';

// ===== ヘルパー =====

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isValidTransformation(result: string): boolean {
  if (!result || result.trim().length === 0) return false;
  if (result.includes('XXX') || result.includes('【') || result.includes('】')) return false;
  return true;
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  operationName: string
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      return result;
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const isRateLimit = errMsg.includes('429') || errMsg.includes('rate limit');
      console.error(`${operationName} error (attempt ${attempt}/${maxRetries}):`, errMsg);

      if (attempt < maxRetries) {
        const baseWaitTime = Math.pow(2, attempt - 1) * 1000;
        const waitTime = isRateLimit ? baseWaitTime * 5 : baseWaitTime;
        await sleep(waitTime);
      } else {
        throw new Error(`${operationName}: ${maxRetries}回のリトライ後も失敗 - ${errMsg}`);
      }
    }
  }
  throw new Error(`${operationName}: 予期しないエラー`);
}

// ===== キャプション生成 =====

export async function generateVideoCaption(videoBase64: string): Promise<string> {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: MODEL_FLASH_LITE });

  const result = await model.generateContent([
    ACTION_RECOGNITION_PROMPT,
    {
      inlineData: {
        data: videoBase64,
        mimeType: 'video/mp4',
      },
    },
  ]);

  return result.response.text();
}

// ===== 抽象化 (リトライ+バリデーション付き) =====

async function getAbstractionResponse(prompt: string, maxRetries: number = 3): Promise<string> {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: MODEL_FLASH });

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      if (isValidTransformation(text)) {
        return text;
      }

      if (attempt < maxRetries) {
        await sleep(Math.pow(2, attempt - 1) * 1000);
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      if (errMsg.includes('429')) {
        await sleep(10000);
      } else if (attempt < maxRetries) {
        await sleep(Math.pow(2, attempt - 1) * 1000);
      }
      if (attempt === maxRetries) {
        throw new Error(`抽象化: ${maxRetries}回のリトライ後も失敗`);
      }
    }
  }
  throw new Error('抽象化: 予期しないエラー');
}

// ===== テキスト応答 =====

async function getTextResponse(prompt: string): Promise<string> {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: MODEL_FLASH_LITE });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

// ===== カテゴリ分類 =====

export interface CategoryResult {
  category: string;
  isInCategory: boolean;
}

export async function categorizeActivity(caption: string): Promise<CategoryResult> {
  return retryWithBackoff(
    async () => {
      const prompt = buildActivityCategorizationPrompt(caption);
      const response = await getTextResponse(prompt);
      const category = response.trim();
      const isInCategory = category !== 'その他';
      return { category, isInCategory };
    },
    3,
    'Category classification'
  );
}

// ===== 返信生成 =====

export type ReplyMethod = 'abstracted' | 'delay';

export interface ReplyResult {
  recipient: RecipientType;
  message: string;
  reply: string;
  method: ReplyMethod;
}

async function generateAbstractedReply(
  caption: string,
  recipient: RecipientType
): Promise<string> {
  return retryWithBackoff(
    async () => {
      const transformPrompt = buildAbstractionPrompt(caption, recipient);
      const transformedActivity = await getAbstractionResponse(transformPrompt);

      const replyPrompt = buildReplyFromAbstractionPrompt(transformedActivity, recipient);
      const reply = await getTextResponse(replyPrompt);
      return reply.trim();
    },
    3,
    `Abstracted reply for ${recipient}`
  );
}

async function generateDelayReply(
  caption: string,
  recipient: RecipientType
): Promise<string> {
  return retryWithBackoff(
    async () => {
      const transformPrompt = buildDelayAbstractionPrompt(caption, recipient);
      const transformedActivity = await getAbstractionResponse(transformPrompt);

      const replyPrompt = buildDelayReplyFromAbstractionPrompt(transformedActivity, recipient);
      const reply = await getTextResponse(replyPrompt);
      return reply.trim();
    },
    3,
    `Delay reply for ${recipient}`
  );
}

export async function generateRepliesForAllRecipients(
  caption: string,
  isInCategory: boolean
): Promise<ReplyResult[]> {
  const recipients: RecipientType[] = ['professor', 'family', 'friend'];

  const generateFn = isInCategory ? generateAbstractedReply : generateDelayReply;
  const method: ReplyMethod = isInCategory ? 'abstracted' : 'delay';

  const replies = await Promise.all(
    recipients.map(recipient => generateFn(caption, recipient))
  );

  return recipients.map((recipient, i) => ({
    recipient,
    message: RECIPIENT_MESSAGES[recipient],
    reply: replies[i],
    method,
  }));
}
