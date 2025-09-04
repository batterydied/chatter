export const truncateFilename = (filename: string) => {
    if(filename.length <= 15) return filename
    return filename.slice(0, 15) + '...'
}

export const truncateMessage = (msg: string) => {
    if(msg.length <= 2000) return msg
    return msg.slice(0, 2000)
}

export const truncateName = (name: string) => {
    if(name.length <= 30) return name
    return name.slice(0, 30)
}
