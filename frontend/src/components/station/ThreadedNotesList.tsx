// src/components/station/ThreadedNotesList.tsx
import React from "react"
import { CollaborationNoteDto } from "../../types/api"
import { formatDate } from "../../utils/formatters"
import { MessageSquare, CornerDownRight } from "lucide-react"

export const ThreadedNotesList: React.FC<{
  notes?: CollaborationNoteDto[]
}> = ({ notes = [] }) => {
  if (!notes || notes.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-slate-400">
        No engineering collaboration notes recorded.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {notes.map((n, idx) => {
        const email = n?.createdByEmail || "Operator"
        const initial = String(email).charAt(0).toUpperCase() || "O"
        const text = n?.noteText || ""
        const date = n?.createdAtUtc || new Date().toISOString()

        return (
          <div
            key={n?.noteId || idx}
            className="p-4 rounded-xl border border-slate-200 bg-white space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                  {initial}
                </div>
                <span className="font-bold text-slate-800">{email}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {formatDate(date)}
              </span>
            </div>

            <p className="text-xs text-slate-700">{text}</p>

            {/* Replies */}
            {n?.replies && n.replies.length > 0 && (
              <div className="ml-4 pl-3 border-l-2 border-slate-200 space-y-2.5 pt-1">
                {n.replies.map((r, rIdx) => {
                  const replyEmail = r?.createdByEmail || "Responder"
                  const replyInitial =
                    String(replyEmail).charAt(0).toUpperCase() || "R"
                  const replyText = r?.noteText || ""
                  const replyDate = r?.createdAtUtc || new Date().toISOString()

                  return (
                    <div key={r?.noteId || rIdx} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          <CornerDownRight className="w-3 h-3 text-slate-400" />
                          <span>{replyEmail}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatDate(replyDate)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 pl-4">{replyText}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
