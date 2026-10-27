"use client";

import { useEffect, useRef, useState } from "react";

import Button from "../ui/Button";

const EMPTY_DRAFT = {
  title: "",
  startDate: "",
  dueDate: "",
  durationMinutes: "",
};

function createEmptyDraft() {
  return { ...EMPTY_DRAFT };
}

function getFocusableElements(dialog) {
  return Array.from(dialog.querySelectorAll("button:not([disabled]), input:not([disabled])"));
}

export default function TodoAddDialog({ onClose, onSubmit, open }) {
  const [draft, setDraft] = useState(createEmptyDraft);
  const [fieldErrors, setFieldErrors] = useState({});
  const dialogRef = useRef(null);
  const titleInputRef = useRef(null);

  useEffect(() => {
    if (open) {
      titleInputRef.current?.focus();
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const resetDialog = () => {
    setDraft(createEmptyDraft());
    setFieldErrors({});
  };

  const handleChange = (field, value) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value,
    }));
    setFieldErrors((currentErrors) => {
      if (!currentErrors[field]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const handleCancel = () => {
    resetDialog();
    onClose();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      handleCancel();
      return;
    }

    if (event.key !== "Tab" || !dialogRef.current) {
      return;
    }

    const focusableElements = getFocusableElements(dialogRef.current);

    if (!focusableElements.length) {
      event.preventDefault();
      return;
    }

    const firstFocusableElement = focusableElements[0];
    const lastFocusableElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstFocusableElement) {
      event.preventDefault();
      lastFocusableElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastFocusableElement) {
      event.preventDefault();
      firstFocusableElement.focus();
    }
  };

  /* const handleSubmit = (event) => {
    event.preventDefault();
    const validation = onSubmit(draft);

    if (!validation.isValid) {
      setFieldErrors(validation.fieldErrors);
      return;
    }

    resetDialog();
    onClose();
  };
  */

  const handleSubmit = async (event) => {
  event.preventDefault();

  const validation = await onSubmit(draft);

  if (!validation.isValid) {
    setFieldErrors(validation.fieldErrors);
    return;
  }

  resetDialog();
  onClose();
  };

  const errors = Object.values(fieldErrors);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#2d3559]/30 p-5">
      <section
        aria-labelledby="todo-add-title"
        aria-modal="true"
        className="w-full max-w-md rounded-3xl border border-[#ece4d9] bg-[#fffdfa] p-5 shadow-[0_24px_70px_rgba(45,53,89,0.28)] sm:p-6"
        onKeyDown={handleKeyDown}
        ref={dialogRef}
        role="dialog"
      >
        <div>
          <p className="text-sm font-bold text-[#5d46b1]">새로운 할 일</p>
          <h2 id="todo-add-title" className="mt-1 text-2xl font-black tracking-[-0.05em] text-[#2d3559]">
            할일 추가
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#5f6680]">
            먼저 저장하고, 나중에 원하는 시간에 배정해보세요.
          </p>
        </div>

        {errors.length ? (
          <div className="mt-5 rounded-2xl bg-[#fff1e8] px-4 py-3 text-sm text-[#a84f38]" role="alert">
            <p className="font-bold">입력 내용을 확인해주세요.</p>
            <ul className="mt-1 list-inside list-disc">
              {errors.map((error) => <li key={error}>{error}</li>)}
            </ul>
          </div>
        ) : null}

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-bold text-[#4d5577]" htmlFor="todo-title">할 일</label>
            <input
              ref={titleInputRef}
              aria-describedby={fieldErrors.title ? "todo-title-error" : undefined}
              aria-invalid={Boolean(fieldErrors.title)}
              className="mt-1.5 w-full rounded-xl border border-[#e8e0d6] bg-white px-3 py-2.5 text-sm text-[#2d3559] outline-none transition placeholder:text-[#b1b2c2] focus:border-[#aa9bea] focus:ring-4 focus:ring-[#ede9ff]"
              id="todo-title"
              onChange={(event) => handleChange("title", event.target.value)}
              placeholder="할 일을 적어주세요"
              type="text"
              value={draft.title}
            />
            {fieldErrors.title ? <p id="todo-title-error" className="mt-1.5 text-xs font-medium text-[#a84f38]">{fieldErrors.title}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-bold text-[#4d5577]" htmlFor="todo-start-date">시작 날짜</label>
              <input
                aria-describedby={fieldErrors.startDate ? "todo-start-date-error" : undefined}
                aria-invalid={Boolean(fieldErrors.startDate)}
                className="mt-1.5 w-full rounded-xl border border-[#e8e0d6] bg-white px-3 py-2.5 text-sm text-[#2d3559] outline-none transition focus:border-[#aa9bea] focus:ring-4 focus:ring-[#ede9ff]"
                id="todo-start-date"
                onChange={(event) => handleChange("startDate", event.target.value)}
                type="date"
                value={draft.startDate}
              />
              {fieldErrors.startDate ? <p id="todo-start-date-error" className="mt-1.5 text-xs font-medium text-[#a84f38]">{fieldErrors.startDate}</p> : null}
            </div>

            <div>
              <label className="text-sm font-bold text-[#4d5577]" htmlFor="todo-due-date">마감 날짜</label>
              <input
                aria-describedby={fieldErrors.dueDate ? "todo-due-date-error" : undefined}
                aria-invalid={Boolean(fieldErrors.dueDate)}
                className="mt-1.5 w-full rounded-xl border border-[#e8e0d6] bg-white px-3 py-2.5 text-sm text-[#2d3559] outline-none transition focus:border-[#aa9bea] focus:ring-4 focus:ring-[#ede9ff]"
                id="todo-due-date"
                onChange={(event) => handleChange("dueDate", event.target.value)}
                type="date"
                value={draft.dueDate}
              />
              {fieldErrors.dueDate ? <p id="todo-due-date-error" className="mt-1.5 text-xs font-medium text-[#a84f38]">{fieldErrors.dueDate}</p> : null}
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-[#4d5577]" htmlFor="todo-duration">예상 소요 시간(분)</label>
            <input
              aria-describedby={fieldErrors.durationMinutes ? "todo-duration-error" : undefined}
              aria-invalid={Boolean(fieldErrors.durationMinutes)}
              className="mt-1.5 w-full rounded-xl border border-[#e8e0d6] bg-white px-3 py-2.5 text-sm text-[#2d3559] outline-none transition placeholder:text-[#b1b2c2] focus:border-[#aa9bea] focus:ring-4 focus:ring-[#ede9ff]"
              id="todo-duration"
              max="960"
              min="30"
              onChange={(event) => handleChange("durationMinutes", event.target.value)}
              placeholder="예: 60"
              step="30"
              type="number"
              value={draft.durationMinutes}
            />
            {fieldErrors.durationMinutes ? <p id="todo-duration-error" className="mt-1.5 text-xs font-medium text-[#a84f38]">{fieldErrors.durationMinutes}</p> : null}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={handleCancel} type="button" variant="ghost">취소</Button>
            <Button type="submit">확인</Button>
          </div>
        </form>
      </section>
    </div>
  );
}
