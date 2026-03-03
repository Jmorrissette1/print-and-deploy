"use client";

import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "./msal-config";
import { ReactNode, useEffect, useState } from "react";

const msalInstance = new PublicClientApplication(msalConfig);

export default function MsalAuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    msalInstance.initialize().then(() => {
      msalInstance
        .handleRedirectPromise()
        .then((response) => {
          if (response?.account) {
            msalInstance.setActiveAccount(response.account);
          } else {
            const accounts = msalInstance.getAllAccounts();
            if (accounts.length > 0) {
              msalInstance.setActiveAccount(accounts[0]);
            }
          }
          setIsReady(true);
        })
        .catch((error) => {
          console.error("Redirect error:", error);
          setIsReady(true);
        });
    });
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-red-800 text-xl">Loading...</p>
      </div>
    );
  }

  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
}
