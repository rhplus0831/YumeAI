import {ChakraProps, Image} from '@chakra-ui/react'
import React from "react";

interface TopAvatarProps extends ChakraProps {
    src: string | undefined
    onClick?: React.MouseEventHandler<HTMLImageElement> | undefined
}

export default function YumeAvatar(props: TopAvatarProps) {
    return (
        <Image {...props} minWidth={'48px'} maxWidth={'48px'} minHeight={'48px'} maxHeight={'48px'} onClick={props.onClick} objectFit='cover' borderRadius='full' objectPosition={'top'}></Image>
    )
}