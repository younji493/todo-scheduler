// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from "vitest";
let db;
const a = "00000000-0000-4000-8000-00000000000a";
const b = "00000000-0000-4000-8000-00000000000b";
const own = "10000000-0000-4000-8000-00000000000a";
const other = "10000000-0000-4000-8000-00000000000b";
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated;
    create schema auth; create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to authenticated, anon; grant execute on function auth.uid() to authenticated, anon;
    insert into auth.users values ('${a}'),('${b}');`);
  await db.exec(await readFile(new URL("../../../supabase/migrations/202611110001_create_todos.sql", import.meta.url), "utf8"));
  await db.exec(`insert into public.todos (id,user_id,title,start_date,due_date) values
    ('${own}','${a}','own','2026-11-12','2026-11-12'),('${other}','${b}','other','2026-11-12','2026-11-12');`);
}, 60000);
beforeEach(async () => { await db.exec(`begin; set local role authenticated; set local request.jwt.claim.sub = '${a}';`); });
afterEach(async () => { await db.exec("rollback"); });
afterAll(async () => { await db?.close(); });
it("enforces owner-only reads in PostgreSQL RLS", async () => {
  expect((await db.query("select title from todos")).rows).toEqual([{ title: "own" }]);
});
it("allows inserting an owned todo and returns a generated UUID", async () => {
  const { rows } = await db.query(`insert into todos(user_id,title,start_date,due_date) values('${a}','new','2026-11-12','2026-11-12') returning id`);
  expect(rows[0].id).toMatch(/^[0-9a-f-]{36}$/);
});
it("blocks forging another user's ownership on insert", async () => {
  await expect(db.exec(`insert into todos(user_id,title,start_date,due_date) values('${b}','forged','2026-11-12','2026-11-12')`)).rejects.toThrow(/row-level security/);
});
it("allows completion changes to an owned row", async () => {
  expect((await db.query(`update todos set completed=true where id='${own}' returning completed`)).rows).toEqual([{ completed: true }]);
});
it("cannot update another user's row", async () => {
  expect((await db.query(`update todos set completed=true where id='${other}' returning id`)).rows).toEqual([]);
});
it("denies ownership changes even for an owned todo", async () => {
  await expect(db.exec(`update todos set user_id='${b}' where id='${own}'`)).rejects.toThrow(/permission denied/);
});
it("denies anonymous reads", async () => {
  await db.exec("set local role anon; set local request.jwt.claim.sub = '';");
  await expect(db.query("select * from todos")).rejects.toThrow(/permission denied/);
});
it("rejects times inconsistent with duration at the database boundary", async () => {
  await expect(db.exec(`insert into todos(user_id,title,start_date,due_date,duration_minutes,start_at,end_at)
    values('${a}','invalid','2026-11-12','2026-11-12',60,'2026-11-12T15:00:00+09:00','2026-11-12T15:30:00+09:00')`)).rejects.toThrow(/valid_todo_times/);
});
it("does not allow deletion through the public authenticated role", async () => {
  await expect(db.exec(`delete from todos where id='${own}'`)).rejects.toThrow(/permission denied/);
});
