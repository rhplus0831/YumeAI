import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import App from './App.tsx'
import {ColorModeScript} from "@chakra-ui/react";

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ColorModeScript/>
        <App/>
    </StrictMode>,
)
