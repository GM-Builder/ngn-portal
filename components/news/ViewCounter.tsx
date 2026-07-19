'use client';
import { useEffect } from 'react';

export default function ViewCounter({ articleId }: { articleId: number }) {
  useEffect(() => {
    const key = `viewed_article_${articleId}`;
    if (sessionStorage.getItem(key)) return; // already viewed in this session

    fetch(`/api/articles/${articleId}/view`, { method: 'POST', cache: 'no-store' })
      .then((res) => {
        if (res.ok) {
          sessionStorage.setItem(key, '1');
        }
      })
      .catch((err) => console.error('Error incrementing view count:', err));
  }, [articleId]);

  return null;
}
