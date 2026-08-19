import { Inbox } from 'lucide-react'
export function EmptyState({ title, detail }: { title: string; detail: string }) { return <div className="empty-state"><Inbox size={26} /><strong>{title}</strong><p>{detail}</p></div> }
