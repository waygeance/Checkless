import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/react";
import { BrowserRouter } from "react-router-dom";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/ibm-plex-sans";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/600.css";
import App from "./App";
import "./App.css";

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPublishableKey) {
  throw new Error(
    "Missing VITE_CLERK_PUBLISHABLE_KEY. Add the Clerk development key to the root .env file."
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/play"
      signUpFallbackRedirectUrl="/play"
      afterSignOutUrl="/"
      appearance={{
        variables: {
          colorPrimary: "#c8ff00",
          colorBackground: "#241a16",
          colorText: "#f0eadc",
          colorTextSecondary: "#d8d0c0",
          colorTextOnPrimaryBackground: "#1a1400",
          colorNeutral: "#d8d0c0",
          colorInputBackground: "#1c1410",
          colorInputText: "#f0eadc",
          colorDanger: "#ff6b5f",
          borderRadius: "0.875rem",
          fontFamily:
            "'Segoe UI', 'Helvetica Neue', Arial, ui-sans-serif, system-ui, sans-serif",
          fontSize: "15px"
        },
        elements: {
          card: "shadow-none bg-transparent border-0",
          headerTitle: "text-cream font-bold tracking-tight",
          headerSubtitle: "text-cream-muted",
          formFieldLabel: "text-cream-muted text-xs uppercase tracking-widest",
          formFieldInput:
            "border border-white/10 focus:border-lime/60 focus:ring-1 focus:ring-lime/40 transition-colors",
          formButtonPrimary:
            "bg-lime text-espresso font-bold hover:bg-lime-hover active:translate-y-px shadow-tactile-btn",
          footerActionLink: "text-lime hover:text-lime-hover font-semibold",
          identityPreviewText: "text-cream",
          identityPreviewEditButton: "text-lime",
          dividerLine: "bg-white/10",
          dividerText: "text-cream-muted/60 text-xs uppercase tracking-widest",
          socialButtonsBlockButton:
            "border border-white/10 bg-mocha hover:bg-mocha-soft hover:border-white/20 text-cream transition-colors",
          socialButtonsBlockButtonText: "text-cream font-medium",
          badge: "bg-lime/15 text-lime border-lime/20"
        }
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>
);
