import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function AskDock() {
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  return (
    <form className="ask-dock is-sticky no-print" onSubmit={(event) => {
      event.preventDefault();
      const question = value.trim();
      navigate(question.length >= 2 ? `/student/saathy?q=${encodeURIComponent(question)}` : '/student/saathy');
    }}>
      <label className="sr-only" htmlFor="ask-saathy-dock">Ask Saathy</label>
      <input id="ask-saathy-dock" name="question" maxLength={1000} placeholder="Ask Saathy anything…" value={value} onChange={(event) => { setValue(event.target.value); }} />
    </form>
  );
}
