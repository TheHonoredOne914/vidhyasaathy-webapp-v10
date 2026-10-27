import { useEffect } from 'react';

function setMeta(selector: string, attribute: 'content', value: string): void {
  const element = document.head.querySelector(selector);
  if (element) element.setAttribute(attribute, value);
}

export function usePageMeta(title: string, description: string): void {
  useEffect(() => {
    document.title = title;
    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
  }, [title, description]);
}
