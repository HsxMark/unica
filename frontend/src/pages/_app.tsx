import React, { useState, useEffect } from 'react';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { ChakraProvider } from '@chakra-ui/react';
import { appWithTranslation } from 'next-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { localeResources } from '@/locales';
import { ToastContextProvider } from '@/contexts/toast';
import { AuthContextProvider } from '@/contexts/auth';
import { UserContextProvider } from '@/contexts/user';
import MainLayout from '@/layouts/main-layout';
import OrganizationLayout from '@/layouts/organization-layout';
import ProjectLayout from '@/layouts/project-layout';
import SettingsLayout from '@/layouts/settings-layout';
import { useAxiosInterceptors } from '@/services/request';
import theme from '../theme';
import '@/styles/globals.css';
import { changeLanguageWithRouter, changeLanguage } from '@/locales';

i18n
  .use(initReactI18next)
  .init({
    resources: localeResources,
    fallbackLng: process.env.NEXT_PUBLIC_I18N_FALLBACK_LANGUAGE || 'en',
    interpolation: {
      escapeValue: false,
    },
});

function App({ Component, pageProps }: AppProps) {
  const [mounted, setMounted] = useState<boolean>(false);
  const router = useRouter();

  useAxiosInterceptors();
  
  useEffect(() => {
    changeLanguageWithRouter(router); // Detect and apply the correct locale on app load

    setMounted(true);
  }, [router.locale]);


  if (!mounted) return <></>;

  const layoutMappings: { prefix: string; layout: React.ComponentType<{ children: React.ReactNode }> }[] = [
    { prefix: '/organizations/[id]/', layout: OrganizationLayout },
    { prefix: '/projects/[id]/', layout: ProjectLayout },
    { prefix: '/settings/', layout: SettingsLayout },
  ];

  let SpecLayout: React.ComponentType<{ children: React.ReactNode }> = React.Fragment;

  for (const mapping of layoutMappings) {
    if (router.pathname.startsWith(mapping.prefix)) { SpecLayout = mapping.layout; break; }
  }

  return (
    <ChakraProvider theme={theme}>
      <ToastContextProvider>
        <UserContextProvider>
          <AuthContextProvider>
            <MainLayout>
              <SpecLayout>
                <Component {...pageProps} />
              </SpecLayout>
            </MainLayout>
          </AuthContextProvider>
        </UserContextProvider>   
      </ToastContextProvider>
    </ChakraProvider>
  );
}

export default appWithTranslation(App);
