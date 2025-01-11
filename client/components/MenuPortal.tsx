"use client"

import React, {createContext, ReactNode, useContext, useState} from 'react';

interface MenuPortalContextProps {
    menuContent: ReactNode | null;
    setMenuContent: (content: ReactNode | null) => void;
}

export const MenuPortalContext = createContext<MenuPortalContextProps | undefined>(undefined);

export const MenuPortalProvider = ({ children }: {children: ReactNode}) => {
    const [menuContent, setMenuContent] = useState<ReactNode | undefined>(null);

    return (
        <MenuPortalContext.Provider value={{ menuContent, setMenuContent }}>
            {children}
        </MenuPortalContext.Provider>
    );
};

export const useMenuPortal = () => {
    const context = useContext(MenuPortalContext);
    if (!context) {
        throw new Error(
            'useLayoutPortal must be used within a LayoutPortalProvider'
        );
    }
    return context;
};

export default function YumeMenu({children}: {children: ReactNode}) {
    const {menuContent, setMenuContent} = useMenuPortal();

    React.useEffect(() => {
        setMenuContent(children);

        // 컴포넌트가 unmount될 때 menuContent를 초기화
        return () => {
            setMenuContent(null);
        };
    }, [children, setMenuContent]);

    return <></>
}

export function YumeMenuDest() {
    const {menuContent, setMenuContent} = useMenuPortal();

    return menuContent ? menuContent : <></>
}