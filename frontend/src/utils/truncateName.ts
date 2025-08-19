const truncateName = (name: string) => {
    if(name.length <= 30) return name
    return name.slice(0, 30)
}

export default truncateName