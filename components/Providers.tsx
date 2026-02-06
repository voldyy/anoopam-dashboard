'use client';
import { Providers } from '@microsoft/mgt-element';
import { Msal2Provider } from '@microsoft/mgt-msal2-provider';
import { useEffect } from 'react';

export function MgtProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize the Graph Toolkit with your Client ID
    if (!Providers.globalProvider) {
      Providers.globalProvider = new Msal2Provider({
        clientId: '2e009ac6-134d-44d7-b71a-d4a767e1814e', 
        scopes: ['Sites.ReadWrite.All', 'User.Read']
      });
    }
  }, []);

  return <>{children}</>;
}