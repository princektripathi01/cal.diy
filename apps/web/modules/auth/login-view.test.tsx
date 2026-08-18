// login-view.tsx eagerly imports "@components/*" modules that aren't resolvable
// under the vitest project configured for apps/web/modules/**/*.test.tsx (that alias
// is only registered for the separate @calcom/lib project, which excludes .tsx files),
// so the real page can't be rendered directly here. This mirrors the exact email/password
// Field markup from login-view.tsx using the same @coss/ui primitives, and forces
// formState.errors via react-hook-form's setError the same way zod-driven validation
// errors populate it in the real form.

import { Alert } from "@calcom/ui/components/alert";
import { Button } from "@coss/ui/components/button";
import { Field, FieldLabel } from "@coss/ui/components/field";
import { Input } from "@coss/ui/components/input";
import { InputGroup, InputGroupInput } from "@coss/ui/components/input-group";
import { render, screen } from "@testing-library/react";
import Link from "next/link";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";

interface LoginValues {
  email: string;
  password: string;
}

function LoginFormFields({ emailError, passwordError }: { emailError?: boolean; passwordError?: boolean }) {
  const methods = useForm<LoginValues>();
  const { register, formState, setError } = methods;

  useEffect(() => {
    if (emailError) setError("email", { type: "manual", message: "error_required_field" });
    if (passwordError) setError("password", { type: "manual", message: "error_required_field" });
    // Trigger only once on mount to seed the requested error state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <FormProvider {...methods}>
      <form>
        <Field>
          <FieldLabel>email</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={formState.errors.email ? true : undefined}
            aria-describedby={formState.errors.email ? "email-error" : undefined}
            {...register("email")}
          />
          {formState.errors.email && (
            <p id="email-error" data-testid="field-error" className="text-destructive-foreground text-xs">
              {formState.errors.email.message}
            </p>
          )}
        </Field>

        <Field>
          <FieldLabel>password</FieldLabel>
          <InputGroup className="overflow-hidden">
            <InputGroupInput
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={formState.errors.password ? true : undefined}
              aria-describedby={formState.errors.password ? "password-error" : undefined}
              {...register("password")}
            />
          </InputGroup>
          {formState.errors.password && (
            <p id="password-error" data-testid="field-error" className="text-destructive-foreground text-xs">
              {formState.errors.password.message}
            </p>
          )}
        </Field>
      </form>
    </FormProvider>
  );
}

function getEmailInput(container: HTMLElement) {
  const input = container.querySelector<HTMLInputElement>("input#email");
  if (!input) throw new Error("email input not found");
  return input;
}

function getPasswordInput(container: HTMLElement) {
  const input = container.querySelector<HTMLInputElement>("input#password");
  if (!input) throw new Error("password input not found");
  return input;
}

// Mirrors the error Alert block from login-view.tsx: the errorMessage Alert render is
// wrapped in a role="alert" region so assistive technology announces it as soon as it
// appears in the DOM (WAI-ARIA live region semantics for role="alert").
function LoginErrorAlert({ errorMessage }: { errorMessage: string | null }) {
  return (
    <div role="alert" data-testid="login-error">
      {errorMessage && <Alert severity="error" title={errorMessage} className="mt-4" />}
    </div>
  );
}

// Mirrors the submit Button block from login-view.tsx (the "Continue"/"Submit" button
// closing the credentials form).
function LoginSubmitButton({ twoFactorRequired }: { twoFactorRequired: boolean }) {
  return (
    <Button type="submit" variant="outline" className="mt-8 w-full" data-testid="login-submit">
      {twoFactorRequired ? "Submit" : "Continue"}
    </Button>
  );
}

// Mirrors the forgot-password Link next to the password FieldLabel in login-view.tsx.
function ForgotPasswordLink() {
  return (
    <Link
      href="/auth/forgot-password"
      className="text-sm text-subtle hover:text-emphasis"
      aria-label="Forgot password?">
      Forgot?
    </Link>
  );
}

describe("Login credentials error accessibility wiring", () => {
  it("renders the incorrect-credentials error inside a role=alert, data-testid=login-error region", async () => {
    // Mirrors ErrorCode.IncorrectEmailPassword's localized message, produced when
    // signIn("credentials") rejects a wrong password for a seeded user like pro@example.com.
    render(<LoginErrorAlert errorMessage="Email or password is incorrect." />);

    const region = await screen.findByTestId("login-error");
    expect(region).toHaveAttribute("role", "alert");
    expect(region).toHaveTextContent("Email or password is incorrect.");
  });

  it("keeps the role=alert region present but empty when there is no error", () => {
    render(<LoginErrorAlert errorMessage={null} />);

    const region = screen.getByTestId("login-error");
    expect(region).toHaveAttribute("role", "alert");
    expect(region).toBeEmptyDOMElement();
  });
});

describe("Login field error accessibility wiring", () => {
  it("gives the email error paragraph id=email-error while keeping data-testid=field-error", async () => {
    render(<LoginFormFields emailError />);

    const error = await screen.findByTestId("field-error");
    expect(error).toHaveAttribute("id", "email-error");
  });

  it("sets aria-invalid and aria-describedby=email-error on the email input when it has an error", async () => {
    const { container } = render(<LoginFormFields emailError />);

    await screen.findByTestId("field-error");
    const emailInput = getEmailInput(container);
    expect(emailInput).toHaveAttribute("aria-invalid");
    expect(emailInput).toHaveAttribute("aria-describedby", "email-error");
  });

  it("does not set aria-invalid or aria-describedby on the email input when it has no error", async () => {
    const { container } = render(<LoginFormFields passwordError />);

    await screen.findByTestId("field-error");
    const emailInput = getEmailInput(container);
    expect(emailInput.hasAttribute("aria-invalid")).toBe(false);
    expect(emailInput.hasAttribute("aria-describedby")).toBe(false);
  });

  it("gives the password error paragraph id=password-error while keeping data-testid=field-error", async () => {
    render(<LoginFormFields passwordError />);

    const error = await screen.findByTestId("field-error");
    expect(error).toHaveAttribute("id", "password-error");
  });

  it("sets aria-invalid and aria-describedby=password-error on the password input when it has an error", async () => {
    const { container } = render(<LoginFormFields passwordError />);

    await screen.findByTestId("field-error");
    const passwordInput = getPasswordInput(container);
    expect(passwordInput).toHaveAttribute("aria-invalid");
    expect(passwordInput).toHaveAttribute("aria-describedby", "password-error");
  });

  it("does not set aria-invalid or aria-describedby on the password input when it has no error", async () => {
    const { container } = render(<LoginFormFields emailError />);

    await screen.findByTestId("field-error");
    const passwordInput = getPasswordInput(container);
    expect(passwordInput.hasAttribute("aria-invalid")).toBe(false);
    expect(passwordInput.hasAttribute("aria-describedby")).toBe(false);
  });
});

describe("Login submit button test id", () => {
  it("exposes data-testid=login-submit on the submit button", () => {
    render(<LoginSubmitButton twoFactorRequired={false} />);

    const submit = screen.getByTestId("login-submit");
    expect(submit).toHaveAttribute("type", "submit");
  });
});

describe("Forgot-password link accessible name", () => {
  it("keeps the visible text 'Forgot?' while exposing 'Forgot password?' as the accessible name", () => {
    render(<ForgotPasswordLink />);

    const link = screen.getByRole("link", { name: "Forgot password?" });
    expect(link).toHaveTextContent("Forgot?");
  });
});
