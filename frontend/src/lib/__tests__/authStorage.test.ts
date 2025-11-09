import { describe, expect, it, beforeEach } from "vitest";

import { clearTokensStorage, loadTokens, saveTokens } from "../authStorage";

describe("authStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves and loads tokens", () => {
    saveTokens({ accessToken: "a", refreshToken: "b" });
    const tokens = loadTokens();
    expect(tokens).toEqual({ accessToken: "a", refreshToken: "b" });
  });

  it("clears tokens when missing", () => {
    saveTokens({ accessToken: "a", refreshToken: "b" });
    clearTokensStorage();
    expect(loadTokens()).toEqual({ accessToken: null, refreshToken: null });
  });

  it("handles malformed storage", () => {
    localStorage.setItem("erp.auth", "not json");
    expect(loadTokens()).toEqual({ accessToken: null, refreshToken: null });
  });
});
