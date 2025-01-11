import {Alert} from "@nextui-org/alert";
import {CircularProgress} from "@nextui-org/react";
import {UsePendingAlertReturn} from "@/components/ui/PendingAlert/usePendingAlert";

export default function PendingAlert(props: UsePendingAlertReturn) {
    return (props.display && <Alert
            description={props.alertDescription}
            title={props.alertTitle}
            startContent={props.alertStatus === "loading" && <CircularProgress/>}
            hideIcon={props.alertStatus === "loading"}/>
    )
}