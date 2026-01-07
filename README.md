# Demo Reply Dashboard

Firebaseに保存された最新のデモ返信をリアルタイムで表示するNext.jsアプリケーション。

## 機能

- 📊 Firestoreから最新のデモ返信データを取得
- 🔄 リアルタイム更新（Firestoreリスナー使用）
- 🎨 モダンなUIデザイン（Tailwind CSS使用）
- ⚡ Next.js 15 App Router使用

## セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/kiba0929/demo-reply-dashboard.git
cd demo-reply-dashboard
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. Firebase設定

Firebase Consoleから以下の情報を取得：

1. [Firebase Console](https://console.firebase.google.com/) を開く
2. プロジェクト `naelab-context-reply` を選択
3. プロジェクト設定 > マイアプリ > Webアプリ を選択
4. 設定情報をコピー

### 4. 環境変数の設定

`.env.local.example` をコピーして `.env.local` を作成：

```bash
cp .env.local.example .env.local
```

`.env.local` を編集して、Firebase Consoleから取得した値を入力：

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-actual-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=naelab-context-reply.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=naelab-context-reply
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=naelab-context-reply.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開く

## プロジェクト構造

```
demo-reply-dashboard/
├── app/
│   └── page.tsx              # メインページ（クライアントコンポーネント）
├── components/
│   ├── DemoReplyCard.tsx     # 返信データ表示カード
│   ├── LoadingState.tsx      # ローディング状態
│   └── EmptyState.tsx        # データが無い場合の表示
├── lib/
│   ├── firebase.ts           # Firebase初期化
│   ├── firestore.ts          # Firestoreクライアント
│   └── types.ts              # TypeScript型定義
└── .env.local                # 環境変数（git管理外）
```

## データ構造

Firestoreコレクション `demo_replies` から以下の構造のデータを取得：

```typescript
interface DemoReplyDocument {
  id: string;
  videoFilePath: string;      // 動画ファイルパス
  videoFileName: string;       // 動画ファイル名
  caption: string;             // Geminiが生成したキャプション
  category: string;            // カテゴリ名
  isInCategory: boolean;       // カテゴリ内かどうか
  replies: Array<{
    recipient: string;         // "professor" | "family" | "friend"
    message: string;           // 受信メッセージ
    reply: string;             // 生成された返信
    method: string;            // "abstracted" | "delay" | "generic"
  }>;
  timestamp: Date;
  createdAt: Date;
}
```

## トラブルシューティング

### Firebase接続エラー

- `.env.local` ファイルが正しく設定されているか確認
- Firebase Consoleでプロジェクトが有効になっているか確認
- ブラウザのコンソールでエラーメッセージを確認

### データが表示されない

- Firestoreの `demo_replies` コレクションにデータが存在するか確認
- Firestoreのセキュリティルールで読み取り権限が許可されているか確認

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プロダクションサーバー起動
npm start

# Lint
npm run lint
```

## デプロイ

### Vercelにデプロイ

1. [Vercel](https://vercel.com) にログイン
2. GitHubリポジトリを接続
3. 環境変数を設定（Vercel ダッシュボード）
4. デプロイ

環境変数は Vercel ダッシュボードで設定してください。
