"use client";

import {Avatar, AvatarProps} from "@nextui-org/react";

export default function YumeAvatar(props: AvatarProps) {
    return (<Avatar {...props} classNames={{img: "object-top"}} />)
}