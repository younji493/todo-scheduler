# Schedule Chat Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan inline.

**Goal:** Add the approved expandable schedule chat UI.

**Architecture:** A persistent client widget in the dashboard layout owns messages, draft and open state. A feature-local panel renders the conversation and composer. No API calls or todo mutations.

**Tech Stack:** Existing React, Next.js, Tailwind CSS, lucide-react.

**Spec:** docs/superpowers/specs/2026-10-27-schedule-chat-design.md

## Global Constraints
- Match the existing lavender and cream design; no new dependencies.
- Keep existing user changes and todo logic untouched.
- Preserve messages while collapsed and navigating dashboard routes.

## Review Focus
- Whitespace messages cannot be sent.
- Korean IME Enter does not submit; Shift+Enter inserts a newline.
- Escape closes the panel and returns focus.
- Long messages wrap, history scrolls and composer stays visible.
- Mobile panel fits the viewport and bottom bar does not cover final page content.

## Task 1: Chat widget
- [x] Add features/chat/ScheduleChat.jsx with persistent state, trigger and submit handling.
- [x] Add features/chat/ChatPanel.jsx with accessible nonmodal panel, log, close and composer.
- [x] Mount once in app/(dashboard)/layout.js; reserve bottom spacing in AppShell.
- [x] Verify production build and inspect final diff. This reversible UI change uses existing checks without adding tests that mirror the implementation.

## Verification
- Browser: opened panel, confirmed empty send disabled, sent a Korean message with Enter, closed with Escape and confirmed focus return, reopened and navigated to /week with message retained; inspected screenshot.
- `git diff --check`: passed.
- `npm run build`: Turbopack child-process failure during CSS processing, reproduced outside restricted execution.
- `npm run build -- --webpack`: compiled successfully; restricted run hit EPERM generating output directories. Unrestricted run completed successfully (exit 0).
- No dependencies, build configuration or existing todo behavior changed.
