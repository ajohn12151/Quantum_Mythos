import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ContactForm } from "./ContactForm";

describe("ContactForm (Talk to us)", () => {
  it("renders the fields and submit button", () => {
    render(<ContactForm />);
    expect(screen.getByPlaceholderText(/Ada Lovelace/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/ada@acme\.com/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /talk to us/i })).toBeInTheDocument();
  });

  it("validates required fields (no confirmation on empty submit)", async () => {
    render(<ContactForm />);
    fireEvent.click(screen.getByRole("button", { name: /talk to us/i }));
    expect(await screen.findByText(/tell us your name/i)).toBeInTheDocument();
    expect(screen.queryByText(/we'll be in touch/i)).not.toBeInTheDocument();
  });

  it("shows a friendly confirmation after a valid submit", async () => {
    render(<ContactForm />);
    fireEvent.change(screen.getByPlaceholderText(/Ada Lovelace/i), { target: { value: "Ada" } });
    fireEvent.change(screen.getByPlaceholderText(/ada@acme\.com/i), {
      target: { value: "ada@acme.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/post-quantum migration/i), {
      target: { value: "We want to map our migration across our domains." },
    });
    fireEvent.click(screen.getByRole("button", { name: /talk to us/i }));
    expect(await screen.findByText(/we'll be in touch/i)).toBeInTheDocument();
  });
});
