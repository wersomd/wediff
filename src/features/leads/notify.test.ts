import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { notifyNewLead } from "./notify";

const LEAD = { name: "Иван", contact: "+7700", message: "сайт", source: "wersomd.github.io" };

describe("notifyNewLead", () => {
  const prevToken = process.env.TELEGRAM_BOT_TOKEN;
  const prevChat = process.env.TELEGRAM_CHAT_ID;
  beforeEach(() => { vi.restoreAllMocks(); });
  afterEach(() => {
    process.env.TELEGRAM_BOT_TOKEN = prevToken;
    process.env.TELEGRAM_CHAT_ID = prevChat;
  });

  it("не зовёт fetch, если env не заданы", async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_CHAT_ID;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await notifyNewLead(LEAD);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("зовёт Telegram API с chat_id и текстом", async () => {
    process.env.TELEGRAM_BOT_TOKEN = "TESTTOKEN";
    process.env.TELEGRAM_CHAT_ID = "123";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    await notifyNewLead(LEAD);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/botTESTTOKEN/sendMessage");
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.chat_id).toBe("123");
    expect(body.text).toContain("Иван");
  });

  it("не бросает, если fetch падает", async () => {
    process.env.TELEGRAM_BOT_TOKEN = "TESTTOKEN";
    process.env.TELEGRAM_CHAT_ID = "123";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("net")));
    await expect(notifyNewLead(LEAD)).resolves.toBeUndefined();
  });
});
