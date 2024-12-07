import Filter from "./Filter.ts";
import {Box, Button} from "@chakra-ui/react";
import {EditIcon} from "@chakra-ui/icons";

export default function FilterBox({filter, openEditor}: { filter: Filter, openEditor: (data: Filter) => void}) {
    return (<Box>
        <Button onClick={() => {openEditor(filter)}} leftIcon={<EditIcon/>}>{filter.name ? filter.name : "이름없는 필터"}</Button>
    </Box>)
}