import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { AuthContext } from "../../../lib/auth";
import { RequireAuth } from "../RequireAuth";

describe("RequireAuth", () => {
  it("redirects to change-password when password change is required", () => {
    render(
      <AuthContext.Provider
        value={{
          state: {
            accessToken: "token",
            refreshToken: "refresh",
            user: null,
            isLoading: false,
            passwordChangeRequired: true
          },
          login: async () => undefined,
          logout: async () => undefined,
          refreshProfile: async () => undefined,
          markPasswordChanged: () => undefined
        }}
      >
        <MemoryRouter initialEntries={["/protected"]}>
          <Routes>
            <Route path="/change-password" element={<div>Change Password</div>} />
            <Route
              path="/protected"
              element={
                <RequireAuth>
                  <div>Protected</div>
                </RequireAuth>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText("Change Password")).toBeInTheDocument();
  });
});
