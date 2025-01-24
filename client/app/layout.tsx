import "@/styles/globals.css";
import {Metadata, Viewport} from "next";
import clsx from "clsx";

import {Providers} from "./providers";

import {siteConfig} from "@/config/site";
import {fontSans} from "@/config/fonts";
import {Navbar} from "@/components/navbar";
import {Noto_Sans_KR} from "next/font/google";
import MenuSidebar from "@/components/ui/MenuSidebar";

export const metadata: Metadata = {
    title: {
        default: siteConfig.name,
        template: `%s - ${siteConfig.name}`,
    },
    description: siteConfig.description,
};

const notoSansKR = Noto_Sans_KR({
    subsets: ["latin"],
    variable: '--font-noto-sans-kr',
    display: "swap",
});

export const viewport: Viewport = {
    themeColor: [
        {media: "(prefers-color-scheme: light)", color: "white"},
        {media: "(prefers-color-scheme: dark)", color: "black"},
    ],
};

export default async function RootLayout({
                                             children,
                                         }: {
    children: React.ReactNode;
}) {
    return (
        <html suppressHydrationWarning lang="en" className={notoSansKR.variable}>
        <head/>
        <body
            className={clsx(
                "min-h-screen bg-background font-sansKR antialiased",
                fontSans.variable,
            )}
        >
        <Providers themeProps={{attribute: "class", defaultTheme: "dark"}}>
            <div className="relative flex flex-col h-screen">
                <Navbar/>
                <MenuSidebar/>
                <main className="p-2 w-screen h-screen overflow-y-auto max-w-7xl mx-auto">
                    {children}
                </main>
            </div>
        </Providers>
        </body>
        </html>
    );
}
