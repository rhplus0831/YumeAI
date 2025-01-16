"use client"

import React, {createContext, ReactNode, useContext, useState} from 'react';

interface CustomNavPortalContextProps {
    customNavContent: ReactNode | null;
    setCustomNavContent: (content: ReactNode | null) => void;
}

export const CustomNavPortalContext = createContext<CustomNavPortalContextProps | undefined>(undefined);

export const CustomNavPortalProvider = ({ children }: {children: ReactNode}) => {
    const [customNavContent, setCustomNavContent] = useState<ReactNode | undefined>(null);

    return (
        <CustomNavPortalContext.Provider value={{ customNavContent, setCustomNavContent }}>
    {children}
    </CustomNavPortalContext.Provider>
);
};

export const useCustomNavPortal = () => {
    const context = useContext(CustomNavPortalContext);
    if (!context) {
        throw new Error(
            'useLayoutPortal must be used within a LayoutPortalProvider'
        );
    }
    return context;
};

export default function YumeCustomNav({children}: {children: ReactNode}) {
    const {customNavContent, setCustomNavContent} = useCustomNavPortal();

    React.useEffect(() => {
        setCustomNavContent(children);

        // 컴포넌트가 unmount될 때 customNavContent를 초기화
        return () => {
            setCustomNavContent(null);
        };
    }, [children, setCustomNavContent]);

    return <></>
}