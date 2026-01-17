import ConfirmDialogProvider from "@/components/ui/ConfirmDialogProvider";
import { AuthProvider } from "@/context/AuthContext";
import { UIProvider } from "@/context/UIContext";
import "@/styles/co2e-cloud-form.css";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Toaster } from "react-hot-toast";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <UIProvider>
        <ConfirmDialogProvider>
          <Component {...pageProps} />
        </ConfirmDialogProvider>

        <Toaster />
      </UIProvider>
    </AuthProvider>
  );
}
