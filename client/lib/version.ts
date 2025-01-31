import {execSync} from 'child_process';

export interface VersionInfo {
    commitHash: string;
    commitDate: string;
}

export function getVersionInfo(): VersionInfo {
    try {
        const commitHash = execSync('git rev-parse --short HEAD').toString().trim();
        const commitDate = execSync('git log -1 --format=%ci').toString().trim();

        return {
            commitHash,
            commitDate,
        };
    } catch (error: any) {
        console.error('Error getting Git version info:', error);
        return {
            commitHash: 'dynamic',
            commitDate: new Date().toISOString(),
        };
    }
}