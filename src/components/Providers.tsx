"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#16202b",
            color: "#f1ede2",
            fontSize: "14px",
          },
        }}
      />
    </SessionProvider>
  );
}
