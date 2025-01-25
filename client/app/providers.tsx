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
import {Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure} from "@nextui-org/react";

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
    const [workerUpdated, setWorkerUpdated] = React.useState(false);
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
                                    setWorkerUpdated(true);
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

    const disclosure = useDisclosure()

    return (
        <CustomNavPortalProvider>
            {workerUpdated ?? <Modal isOpen={disclosure.isOpen} defaultOpen onOpenChange={disclosure.onOpenChange}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">서비스 워커 업데이트</ModalHeader>
                            <ModalBody>
                                <p>
                                    서비스 워커 업데이트가 있습니다, 새로고침을 권장합니다.
                                </p>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>
                                    닫기
                                </Button>
                                <Button color="primary" onPress={() => {
                                    window.location.reload();
                                }}>
                                    새로고침
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>}
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
