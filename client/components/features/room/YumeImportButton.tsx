"use client";

import ImportButton from "@/components/features/ImportButton";
import {importDataFromZip} from "@/lib/data/Importer";

export default function YumeImportButton() {
    return <ImportButton mime={"application/zip"} importer={importDataFromZip} label={"데이터 가져오기"}/>
}