import React, { ReactNode } from "react";

type Props = {
  variant?: "auth" | "app";
  backgroundImage?: string;
  children: ReactNode;
};

export default function SharedLayout({ variant = "app", backgroundImage, children }: Props) {
  if (variant === "auth") {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-cover bg-center bg-fixed px-4"
        style={{ backgroundImage }}
      >
        {children}
      </div>
    );
  }

  return <div className="min-h-screen bg-[#f8f9ff] font-sans text-[#0b1c30]">{children}</div>;
}
