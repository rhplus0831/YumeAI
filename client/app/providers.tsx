"use client";

import type {ThemeProviderProps} from "next-themes";
import {ThemeProvider as NextThemesProvider} from "next-themes";

import * as React from "react";
import {useEffect} from "react";
import {NextUIProvider} from "@nextui-org/system";
import {useRouter} from "next/navigation";
import {NavigationGuardProvider} from "@/lib/import/next-navigation-guard";
import {MenuPortalProvider} from "@/components/MenuPortal";
import {CustomNavPortalProvider} from "@/components/CustomNavPortal";

export interface ProvidersProps {
    children: React.ReactNode;
    themeProps?: ThemeProviderProps;
}

declare module "@react-types/shared" {
    interface RouterConfig {
        routerOptions: NonNullable<
            Parameters<ReturnType<typeof useRouter>["push"]>[1]
        >;
    }
}

export function Providers({children, themeProps}: ProvidersProps) {
    const router = useRouter();

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration().then((registration) => {
                if (!registration) {
                    navigator.serviceWorker
                        .register('/service-worker.js')
                        .then((registration) => {
                            console.log('Service Worker registered: ', registration);
                        })
                        .catch((error) => {
                            console.error('Service Worker registration failed: ', error);
                        });
                } else {
                    console.log('Service Worker already registered:', registration);
                }
            });
        } else {
            console.log('Service Worker is not supported');
        }
    }, []);

    return (
        <CustomNavPortalProvider>
            <MenuPortalProvider>
                <NavigationGuardProvider>
                    <NextUIProvider navigate={router.push}>
                        <NextThemesProvider {...themeProps}>{children}</NextThemesProvider>
                    </NextUIProvider>
                </NavigationGuardProvider>
            </MenuPortalProvider>
        </CustomNavPortalProvider>
    );
}
