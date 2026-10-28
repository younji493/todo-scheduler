"use client";

import { useEffect, useRef } from "react";
import { ArrowUp, MessageCircle, Sparkles, X } from "lucide-react";

export default function ChatPanel({ id, draft, messages, onClose, onDraftChange, onSend }) {
  const inputRef = useRef(null);
  const historyRef = useRef(null);
  const isComposingRef = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const history = historyRef.current;
    if (history) history.scrollTop = history.scrollHeight;
  }, [messages]);

  const submitMessage = (event) => {
    event.preventDefault();
    onSend();
    inputRef.current?.focus();
  };

  const handleInputKeyDown = (event) => {
    if (event.key !== "Enter" || event.shiftKey || isComposingRef.current || event.nativeEvent.isComposing || event.keyCode === 229) return;
    event.preventDefault();
    onSend();
  };

  return (
    <section
      aria-describedby={`${id}-notice`}
      aria-labelledby={`${id}-title`}
      className="flex h-[min(36rem,calc(100dvh-2rem))] flex-col overflow-hidden rounded-3xl border border-[#ded5ff] bg-[#fffdfa] shadow-[0_16px_60px_rgba(80,65,105,0.2)]"
      id={id}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !event.nativeEvent.isComposing && !isComposingRef.current) {
          event.stopPropagation();
          onClose();
        }
      }}
      role="dialog"
    >
      <header className="flex shrink-0 items-center gap-3 border-b border-[#ece4d9] bg-[#f5f2ff] px-5 py-4">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-[#8f7ce7]">
          <Sparkles size={21} aria-hidden="true" />
        </span>
        <div className="flex-1">
          <h2 className="text-sm font-black text-[#2d3559]" id={`${id}-title`}>일정 도우미</h2>
          <p className="mt-0.5 text-xs text-[#727895]">할 일을 편하게 이야기해 주세요</p>
        </div>
        <button aria-label="채팅 닫기" className="rounded-xl p-2 text-[#727895] transition hover:bg-white focus-visible:outline-2 focus-visible:outline-[#8f7ce7]" onClick={onClose} type="button">
          <X size={20} aria-hidden="true" />
        </button>
      </header>

      <div className="diary-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5" ref={historyRef}>
        <div className="mb-5 flex items-start gap-2.5">
          <MessageCircle size={18} className="mt-2 shrink-0 text-[#8f7ce7]" aria-hidden="true" />
          <div className="rounded-2xl rounded-tl-sm bg-[#f5f2ff] px-4 py-3 text-sm leading-6 text-[#4d5577]">
            <p className="font-bold">어떤 일정을 계획하고 있나요?</p>
            <p className="mt-1">예를 들어 “내일 오후 3시에 병원 예약 추가해줘”라고 적어보세요.</p>
          </div>
        </div>
        <div aria-label="대화 내용" aria-live="polite" aria-relevant="additions" className="space-y-3" role="log">
          {messages.map((message) => (
            <div className="flex justify-end" key={message.id}>
              <p className="max-w-[88%] whitespace-pre-wrap break-words rounded-2xl rounded-br-sm bg-[#8f7ce7] px-4 py-3 text-sm leading-6 text-white [overflow-wrap:anywhere]">
                <span className="sr-only">나: </span>{message.content}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="shrink-0 border-t border-[#ece4d9] bg-white px-4 pb-4 pt-3">
        <p className="mb-3 text-xs leading-5 text-[#727895]" id={`${id}-notice`}>AI 연결 준비 중이에요. 지금은 메시지만 전송되며 일정은 추가되지 않아요.</p>
        <form className="flex items-end gap-2 rounded-2xl border border-[#e8e0d6] bg-[#fffdfa] p-2 focus-within:border-[#aa9bea] focus-within:ring-2 focus-within:ring-[#ede9ff]" onSubmit={submitMessage}>
          <label className="sr-only" htmlFor={`${id}-input`}>일정 메시지</label>
          <textarea
            className="max-h-32 min-h-12 min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-6 text-[#2d3559] outline-none placeholder:text-[#9b9eb2]"
            id={`${id}-input`}
            onChange={(event) => onDraftChange(event.target.value)}
            onCompositionEnd={() => { isComposingRef.current = false; }}
            onCompositionStart={() => { isComposingRef.current = true; }}
            onKeyDown={handleInputKeyDown}
            placeholder="추가하고 싶은 일정을 적어주세요"
            ref={inputRef}
            rows={2}
            value={draft}
          />
          <button aria-label="메시지 전송" className="mb-1 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#8f7ce7] text-white transition hover:bg-[#7d68d4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8f7ce7] disabled:cursor-not-allowed disabled:bg-[#eeebf5] disabled:text-[#b1a9c9]" disabled={!draft.trim()} type="submit">
            <ArrowUp size={19} aria-hidden="true" />
          </button>
        </form>
        <p className="mt-2 text-center text-[10px] text-[#9b9eb2]">Enter로 전송 · Shift + Enter로 줄바꿈</p>
      </div>
    </section>
  );
}
