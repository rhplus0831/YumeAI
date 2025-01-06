import "@/styles/globals.css";
import {Metadata, Viewport} from "next";
import clsx from "clsx";

import {Providers} from "./providers";

import {siteConfig} from "@/config/site";
import {fontSans} from "@/config/fonts";
import {Navbar} from "@/components/navbar";
import {Link} from "@nextui-org/link";
import {Noto_Sans_KR} from "next/font/google";

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

export default function RootLayout({
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
                <main className="p-2 mx-auto w-screen max-w-7xl">
                    {children}
                </main>
            </div>
        </Providers>
        </body>
        </html>
    );
}
