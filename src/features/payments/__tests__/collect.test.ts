import { expect, it } from "vitest";
import { collectPayments, remainingAmount } from "../collect";
it("calculates exact remaining amounts", () => {
 expect(remainingAmount("100", ["30", "20"])).toBe("50.00");
 expect(remainingAmount("0.30", ["0.10", "0.20"])).toBe("0.00");
 expect(remainingAmount("100", ["120"])).toBe("0.00");
});
it("includes both directions without combining currencies; excludes closed and undated records", () => {
 const debt = { id: "a", title: "Клиент", principal: "100", payments: ["20"], currency: "KZT", direction: "OWED_TO_ME" as const, status: "OPEN", dueDate: new Date("2026-10-08") };
 const sub = { id: "s", name: "Сервис", amount: "9.99", currency: "USD", active: true, nextPaymentDate: new Date("2026-10-08"), reminderDaysBefore: 3 };
 const result = collectPayments([debt, { ...debt, id: "b", direction: "I_OWE" }, { ...debt, id: "paid", status: "PAID" }, { ...debt, id: "zero", payments: ["100"] }, { ...debt, id: "undated", dueDate: null }], [sub, { ...sub, id: "off", active: false }]);
 expect(result.map(x => x.id)).toEqual(["a", "b", "s"]);
 expect(result.map(x => x.amount)).toEqual(["80.00", "80.00", "9.99"]);
 expect(result.map(x => x.direction)).toEqual(["incoming", "outgoing", "outgoing"]);
});
