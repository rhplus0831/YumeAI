import {Center, Grid, GridItem, Text} from "@chakra-ui/react";
import YumeAvatar from "../../Base/YumeAvatar.tsx";
import {getAPIServer} from "../../../Configure";

export default function MessageBox({message, name, profileImageId}: { message: string, name: string | undefined, profileImageId: string | undefined }) {
    const getAvatarSrc = () => {
        if(!profileImageId) {
            return undefined
        }
        return getAPIServer() + 'image/' + profileImageId
    }
    return (
        <Grid templateAreas={`"icon name"
                  "icon message"`}
              gridTemplateRows={'auto auto'}
              gridTemplateColumns={'auto 1fr'}
              gap={1}
        >
            <GridItem area={'icon'}>
                <Center marginEnd={"8px"} display={'flex'}>
                    <YumeAvatar src={getAvatarSrc()}></YumeAvatar>
                </Center>
            </GridItem>
            <GridItem area={'name'}>
                <Text>
                    {name}
                </Text>
            </GridItem>
            <GridItem area={'message'}>
                <Text whiteSpace={"pre-wrap"}>
                    {message}
                </Text>
            </GridItem>
        </Grid>
    )
}