import { useNavigate } from 'react-router-dom';
import { Saathy } from '../../Saathy';
import { Card, NbButton } from '../../ui';

export function PageAsk({ chapterId, title, topic }: { chapterId: string; title: string; topic: string }) {
  const navigate = useNavigate();
  function openChat() {
    const query = new URLSearchParams({ chapterId, from: 'lesson', label: topic });
    navigate(`/student/saathy?${query.toString()}`);
  }
  return <Card grow>
    <div className="nb-saathy-tip"><Saathy mood="think" size="3.6rem" /><div><h3 className="nb-h3">{title}</h3><div className="nb-text">Take this question into your Saathy conversation.</div></div></div>
    <NbButton size="sm" type="button" onClick={openChat}>Open Saathy</NbButton>
  </Card>;
}
