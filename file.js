import { promises as fsPromises, unlinkSync, existsSync, renameSync } from 'fs'
import { join, resolve } from 'path'


const listFiles = async ({ path }) => {
    let allFiles = []

    try {
        const files = await fsPromises.readdir(path)

        for (const file of files) {
            const filePath = join(path, file)
            const fileStats = await fsPromises.stat(filePath)

            if (fileStats.isDirectory()) {
                const subDirFiles = await listFiles({ path: filePath }) // Recursively list files in subdirectories
                allFiles = allFiles.concat(subDirFiles)
            } else {
                allFiles.push(filePath) // Add file path to the array
            }
        }
    } catch (err) {
        console.error('Error reading directory:', err)
        return { err }
    }

    return allFiles
}

const writeFile = async ({ code, filePath }) => {
    try {
        await fsPromises.writeFile(filePath, code)
        console.info(`File '${filePath}' has been created`)
    } catch (err) {
        console.error('Error writing file:', err)
    }
}

const removeFile = ({ filePath }) => {
    try {
        if (existsSync(filePath)) {
            unlinkSync(filePath)
            console.info(`File removed: ${filePath}`)
        } else {
            console.info(`File does not exist: ${filePath}`)
        }
    } catch (err) {
        console.error(err)
    }
}

const removeManifest = () => {
    renameSync(
        resolve(__dirname, 'dist/.vite/manifest.json'),
        resolve(__dirname, 'dist/manifest.json')
    )
}


export {
    listFiles,
    writeFile,
    removeFile,
    removeManifest,
}

