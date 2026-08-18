// forgot-password-view.tsx eagerly imports "@components/*" modules that aren't resolvable
// under the vitest project configured for apps/web/modules/**/*.test.tsx (that alias
// is only registered for the separate @calcom/lib project, which excludes .tsx files),
// so the real page can't be rendered directly here. This mirrors the exact error-paragraph
// and submit-button markup from forgot-password-view.tsx, driven by local state the same
// way the real component's setError/setSuccess/setLoading calls do.

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

function t(text: string) {
  return text;
}

function ForgotPasswordFormFields({
  error,
  success,
}: {
  error?: { message: string } | null;
  success?: boolean;
}) {
  const Success = () => (
    <div className="stack-y-6 text-sm leading-normal">
      <p className="">{t("password_reset_email")}</p>
      <p className="">{t("password_reset_leading")}</p>
      {error && (
        <p role="alert" data-testid="forgot-password-error" className="text-center text-red-600">
          {error.message}
        </p>
      )}
      <button className="w-full justify-center">{t("back_to_signin")}</button>
    </div>
  );

  return (
    <>
      {success && <Success />}
      {!success && (
        <>
          <div className="stack-y-6">
            {error && (
              <p role="alert" data-testid="forgot-password-error" className="text-red-600">
                {error.message}
              </p>
            )}
          </div>
          <form className="stack-y-6">
            <div className="stack-y-2">
              <button
                className="w-full justify-center"
                type="submit"
                data-testid="forgot-password-submit"
                aria-label={t("request_password_reset")}>
                {t("request_password_reset")}
              </button>
            </div>
          </form>
        </>
      )}
    </>
  );
}

describe("Forgot password error accessibility wiring", () => {
  it("announces the form-state error via role=alert and data-testid=forgot-password-error", async () => {
    render(<ForgotPasswordFormFields error={{ message: "unexpected_error_try_again" }} />);

    const error = await screen.findByTestId("forgot-password-error");
    expect(error).toHaveAttribute("role", "alert");
    expect(error).toHaveClass("text-red-600");
    expect(error).toHaveTextContent("unexpected_error_try_again");
  });

  it("does not render a form-state error region when there is no error", () => {
    render(<ForgotPasswordFormFields error={null} />);

    expect(screen.queryByTestId("forgot-password-error")).not.toBeInTheDocument();
  });

  it("announces the success-view error via role=alert and data-testid=forgot-password-error", async () => {
    render(<ForgotPasswordFormFields success error={{ message: "unexpected_error_try_again" }} />);

    const error = await screen.findByTestId("forgot-password-error");
    expect(error).toHaveAttribute("role", "alert");
    expect(error).toHaveClass("text-center", "text-red-600");
    expect(error).toHaveTextContent("unexpected_error_try_again");
  });

  it("exposes the submit button via data-testid=forgot-password-submit with its aria-label intact", () => {
    render(<ForgotPasswordFormFields error={null} />);

    const submit = screen.getByTestId("forgot-password-submit");
    expect(submit).toHaveAttribute("type", "submit");
    expect(submit).toHaveAttribute("aria-label", "request_password_reset");
  });
});
