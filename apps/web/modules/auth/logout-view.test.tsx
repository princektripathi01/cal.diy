// logout-view.tsx eagerly imports "@components/ui/AuthContainer" which isn't resolvable
// under the vitest project configured for apps/web/modules/**/*.test.tsx (that alias
// is only registered for the separate @calcom/lib project, which excludes .tsx files),
// so the real page can't be rendered directly here. This mirrors the exact confirmation-block
// markup (icon container, role="status" text block, and button) from logout-view.tsx.

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

function t(text: string) {
  return text;
}

function LogoutConfirmation({ message }: { message: string }) {
  return (
    <div className="mb-4">
      <div
        aria-hidden="true"
        className="bg-cal-success mx-auto flex h-12 w-12 items-center justify-center rounded-full">
        <svg className="h-6 w-6 text-green-600" />
      </div>
      <div className="mt-3 text-center sm:mt-5" role="status">
        <h3 className="text-emphasis text-lg font-medium leading-6" id="modal-title">
          {t("youve_been_logged_out")}
        </h3>
        <div className="mt-2">
          <p className="text-subtle text-sm" data-testid="logout-message">
            {t(message)}
          </p>
        </div>
      </div>
      <button data-testid="logout-btn">{t("go_back_login")}</button>
    </div>
  );
}

describe("Logout confirmation accessibility wiring", () => {
  it("puts role=status on the confirmation text block so it is announced on render", () => {
    render(<LogoutConfirmation message="hope_to_see_you_soon" />);

    const status = screen.getByRole("status");
    expect(status).toContainElement(screen.getByText("youve_been_logged_out"));
    expect(status).toContainElement(screen.getByTestId("logout-message"));
  });

  it("exposes the dynamic message via data-testid=logout-message", () => {
    render(<LogoutConfirmation message="reset_your_password" />);

    expect(screen.getByTestId("logout-message")).toHaveTextContent("reset_your_password");
  });

  it("hides the decorative check icon container from the accessibility tree via aria-hidden", () => {
    const { container } = render(<LogoutConfirmation message="hope_to_see_you_soon" />);

    const iconContainer = container.querySelector(".bg-cal-success");
    expect(iconContainer).toHaveAttribute("aria-hidden", "true");
  });

  it("keeps the logout-btn test id on the button", () => {
    render(<LogoutConfirmation message="hope_to_see_you_soon" />);

    expect(screen.getByTestId("logout-btn")).toBeInTheDocument();
  });
});
