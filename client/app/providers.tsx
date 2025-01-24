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
                    registration.update().catch((error) => {
                        console.error('Service Worker update failed: ', error);
                    });

                    registration.onupdatefound = () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                            newWorker.onstatechange = () => {
                                if (newWorker.state === 'installed') {
                                    if (navigator.serviceWorker.controller) {
                                        // 새로운 서비스 워커가 설치(업데이트)됨, 알림 표시 등 처리 가능
                                        console.log('New Service Worker is installed. Ready to activate.');
                                        // 필요 시 다음 코드로 업데이트 작업 완료:
                                        newWorker.postMessage({ action: 'SKIP_WAITING' });
                                    } else {
                                        console.log('Service Worker installed for the first time.');
                                    }
                                }
                            };
                        }
                    };
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
