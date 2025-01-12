import {ReactNode, useEffect, useState} from "react";
import {Popover, PopoverContent, PopoverTrigger, Select} from "@nextui-org/react";

export default function ErrorPopover({errorMessage, children}: { errorMessage: string, children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (errorMessage) {
            setIsOpen(true)
        } else {
            setIsOpen(false)
        }
    }, [errorMessage])

    return (<Popover shouldBlockScroll={false} shouldCloseOnScroll={true} shouldCloseOnBlur={true} showArrow size={"lg"}
                     color={"danger"} isOpen={isOpen} onOpenChange={(open) => {
        if (!open) {
            setIsOpen(false)
        }
    }} shouldCloseOnInteractOutside={() => true}>
        <PopoverTrigger>
            {children}
        </PopoverTrigger>
        <PopoverContent>
            <p>{errorMessage}</p>
        </PopoverContent>
    </Popover>)
}