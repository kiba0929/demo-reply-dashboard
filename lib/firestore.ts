import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  Unsubscribe,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { DemoReplyDocument } from './types';

/**
 * Listen to the latest demo reply document in real-time
 * @param callback Function to call when data updates
 * @returns Unsubscribe function to stop listening
 */
export function subscribeToLatestDemoReply(
  callback: (data: DemoReplyDocument | null) => void
): Unsubscribe {
  const q = query(
    collection(db, 'demo_replies'),
    orderBy('timestamp', 'desc'),
    limit(1)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        callback(null);
        return;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();

      const demoReply: DemoReplyDocument = {
        id: doc.id,
        videoFilePath: data.videoFilePath || '',
        videoFileName: data.videoFileName || '',
        caption: data.caption || '',
        category: data.category || '',
        isInCategory: data.isInCategory || false,
        replies: data.replies || [],
        timestamp: data.timestamp instanceof Timestamp
          ? data.timestamp.toDate()
          : null,
        createdAt: data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : null,
      };

      callback(demoReply);
    },
    (error) => {
      console.error('Error listening to demo replies:', error);
      callback(null);
    }
  );
}
