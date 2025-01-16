"use client";

import {Avatar, AvatarProps} from "@nextui-org/react";

export default function YumeAvatar(props: AvatarProps) {
    const {className, ...rest} = props;

    return (<Avatar showFallback className={`${className ? className + ' ' : ''}min-w-[40px] min-h-[40px]`} {...rest}
                    classNames={{img: "object-top"}}/>)
}