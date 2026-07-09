import { describe, it, expect } from "vitest";
import { leadInboundSchema, leadStatusSchema } from "./schema";

describe("leadInboundSchema", () => {
  it("парсит валидную заявку и проставляет дефолты", () => {
    const r = leadInboundSchema.safeParse({ name: " Иван ", contact: "+7700" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.name).toBe("Иван");
      expect(r.data.message).toBe("");
      expect(r.data.source).toBe("wersomd.github.io");
      expect(r.data.website).toBe("");
    }
  });

  it("отклоняет пустое имя", () => {
    const r = leadInboundSchema.safeParse({ name: "", contact: "x" });
    expect(r.success).toBe(false);
  });

  it("отклоняет пустой контакт", () => {
    const r = leadInboundSchema.safeParse({ name: "Иван", contact: "" });
    expect(r.success).toBe(false);
  });
});

describe("leadStatusSchema", () => {
  it("принимает валидный статус", () => {
    expect(leadStatusSchema.safeParse("CONTACTED").success).toBe(true);
  });
  it("отклоняет мусор", () => {
    expect(leadStatusSchema.safeParse("SPAM").success).toBe(false);
  });
});
