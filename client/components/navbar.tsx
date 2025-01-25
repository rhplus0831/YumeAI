"use client";

import {
    Button,
    Drawer,
    DrawerBody,
    DrawerContent,
    DrawerHeader,
    Navbar as NextUINavbar,
    NavbarBrand,
    NavbarContent,
    NavbarItem,
    NavbarMenu,
    NavbarMenuItem,
    NavbarMenuToggle,
    useDisclosure,
} from "@nextui-org/react";
import {link as linkStyles} from "@nextui-org/theme";
import NextLink from "next/link";
import clsx from "clsx";

import {siteConfig} from "@/config/site";
import {ThemeSwitch} from "@/components/theme-switch";
import {MdOutlineSettings} from "react-icons/md";
import {useMenuPortal} from "@/components/MenuPortal";
import {useState} from "react";
import {usePathname, useRouter} from "next/navigation";
import {RiChatAiFill} from "react-icons/ri";
import {useCustomNavPortal} from "@/components/CustomNavPortal";

export const Navbar = () => {
    const drawerClosure = useDisclosure()
    const {menuContent, setMenuContent} = useMenuPortal();
    const {customNavContent, setCustomNavContent} = useCustomNavPortal();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname()

    if (pathname === "/login") return <></>;
    if (pathname === "/tos") return <></>;

    return (<>
        <Drawer isOpen={drawerClosure.isOpen} placement={"left"} onOpenChange={drawerClosure.onOpenChange}>
            <DrawerContent>
                {(onClose) => (
                    <>
                        <DrawerHeader className="flex flex-col gap-1">설정</DrawerHeader>
                        <DrawerBody>
                            {menuContent}
                        </DrawerBody>
                    </>
                )}
            </DrawerContent>
        </Drawer>
        <NextUINavbar maxWidth="xl" position="sticky" isMenuOpen={isMenuOpen} onMenuOpenChange={setIsMenuOpen}>
            <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
                <NavbarMenuToggle
                    aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                    className="sm:hidden"
                />
                <NavbarBrand as="li" className="gap-3 max-w-fit">
                    {customNavContent ? <div className={"flex flex-row max-w-[50vw]"}>{customNavContent}</div> :
                        <>
                            <RiChatAiFill size={"24"}/>
                            <p className="font-bold text-inherit">YumeAI</p>
                        </>
                    }
                </NavbarBrand>
                <ul className="hidden lg:flex gap-4 justify-start ml-2">
                    {siteConfig.navItems.map((item) => (
                        <NavbarItem key={item.href}>
                            <NextLink
                                className={clsx(
                                    linkStyles({color: "foreground"}),
                                    "data-[active=true]:text-primary data-[active=true]:font-medium",
                                )}
                                color="foreground"
                                href={item.href}
                            >
                                {item.label}
                            </NextLink>
                        </NavbarItem>
                    ))}
                </ul>
            </NavbarContent>

            <NavbarContent
                className="hidden fhd:flex basis-1/5 sm:basis-full"
                justify="end"
            >
                <NavbarItem className="hidden sm:flex gap-2">
                    <ThemeSwitch/>
                </NavbarItem>
            </NavbarContent>

            <NavbarContent className="fhd:hidden basis-1 pl-4" justify="end">
                {menuContent &&
                    <Button variant={"light"} className={"block fhd:hidden"} onPress={drawerClosure.onOpen} isIconOnly>
                        <div className={"flex justify-center items-center"}>
                            <MdOutlineSettings size={22}/>
                        </div>
                    </Button>}
                <ThemeSwitch/>
            </NavbarContent>

            <NavbarMenu>
                {siteConfig.navItems.map((item) => (
                    <NavbarMenuItem key={`${item.label}`}>
                        <button
                            className="w-full"
                            onClick={() => {
                                router.push(item.href)
                                setIsMenuOpen(false)
                            }}
                        >
                            {item.label}
                        </button>
                    </NavbarMenuItem>
                ))}
            </NavbarMenu>
        </NextUINavbar>
    </>);
};
