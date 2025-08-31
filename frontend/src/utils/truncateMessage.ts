const truncateMessage = (msg: string) => {
    if(msg.length <= 2000) return msg
    return msg.slice(0, 2000)
}

export default truncateMessage