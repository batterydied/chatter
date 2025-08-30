import { XIcon } from "../../../assets/icons"

type CloseButtonProps = {
    onClick?: (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => void,
    className?: string
}

const CloseButton = ({onClick, className} : CloseButtonProps) => {
    return (
        <XIcon
            onClick={onClick}
            className={`${className} rounded-full hover:outline-1 hover:outline-accent text-gray-400 hover:text-white hover:cursor-pointer`}
        />
    )
}

export default CloseButton