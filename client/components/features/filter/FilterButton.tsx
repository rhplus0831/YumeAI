import {Button} from "@nextui-org/react";
import Filter from "@/lib/data/Filter";
import {MdEdit} from "react-icons/md";

export default function FilterButton({filter, openEditor}:
                                     { filter: Filter, openEditor: (data: Filter) => void }) {
    return <Button startContent={<MdEdit size={24} />} onPress={() => {
        openEditor(filter)
    }}>{filter.name ? filter.name : '이름없는 필터'}</Button>
}