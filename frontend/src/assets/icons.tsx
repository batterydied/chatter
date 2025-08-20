type IconProps = {
    className?: string,
    onClick?: React.MouseEventHandler<SVGSVGElement>,
    size?: number
}
export const EditIcon = ({className, onClick, size=24}: IconProps) => {
    return (
        <svg onClick={onClick} className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} color='currentColor' fill="none">
            <path d="M15.2141 5.98239L16.6158 4.58063C17.39 3.80646 18.6452 3.80646 19.4194 4.58063C20.1935 5.3548 20.1935 6.60998 19.4194 7.38415L18.0176 8.78591M15.2141 5.98239L6.98023 14.2163C5.93493 15.2616 5.41226 15.7842 5.05637 16.4211C4.70047 17.058 4.3424 18.5619 4 20C5.43809 19.6576 6.94199 19.2995 7.57889 18.9436C8.21579 18.5877 8.73844 18.0651 9.78375 17.0198L18.0176 8.78591M15.2141 5.98239L18.0176 8.78591" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M11 20H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    )
}

export const SmileIcon = ({className, onClick, size=24}: IconProps) => {
    return (
        <svg onClick={onClick} className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} color='currentColor' fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></circle>
            <path d="M8 15C8.91212 16.2144 10.3643 17 12 17C13.6357 17 15.0879 16.2144 16 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
            <path d="M8.00897 9L8 9M16 9L15.991 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
    )
}

export const ReplyIcon = ({className, onClick, size=24}: IconProps) => {
    return (
        <svg onClick={onClick} className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} color='currentColor' fill="none">
            <path d="M20 21V18.9231C20 16.9221 20 15.9217 19.8547 15.0846C19.0547 10.4765 15.0934 6.86243 10.0426 6.13259C9.12509 6 7.19318 6 5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7 3C6.39316 3.58984 4 5.15973 4 6C4 6.84027 6.39316 8.41016 7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

export const DeleteIcon = ({className, onClick, size=24}: IconProps) => {
    return (
        <svg onClick={onClick} className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} color='currentColor' fill="none">
            <path d="M19.5 5.5L18.8803 15.5251C18.7219 18.0864 18.6428 19.3671 18.0008 20.2879C17.6833 20.7431 17.2747 21.1273 16.8007 21.416C15.8421 22 14.559 22 11.9927 22C9.42312 22 8.1383 22 7.17905 21.4149C6.7048 21.1257 6.296 20.7408 5.97868 20.2848C5.33688 19.3626 5.25945 18.0801 5.10461 15.5152L4.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M3 5.5H21M16.0557 5.5L15.3731 4.09173C14.9196 3.15626 14.6928 2.68852 14.3017 2.39681C14.215 2.3321 14.1231 2.27454 14.027 2.2247C13.5939 2 13.0741 2 12.0345 2C10.9688 2 10.436 2 9.99568 2.23412C9.8981 2.28601 9.80498 2.3459 9.71729 2.41317C9.32164 2.7167 9.10063 3.20155 8.65861 4.17126L8.05292 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M9.5 16.5L9.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M14.5 16.5L14.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    )
}

export const RemoveUserIcon = ({className, onClick, size=24}: IconProps) => {
    return (
        <svg onClick={onClick} className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} color='currentColor' fill="none">
            <path d="M14.5 8C14.5 5.23858 12.2614 3 9.5 3C6.73858 3 4.5 5.23858 4.5 8C4.5 10.7614 6.73858 13 9.5 13C12.2614 13 14.5 10.7614 14.5 8Z" stroke='currentColor' strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15.5 21L18.5 18M18.5 18L21.5 15M18.5 18L15.5 15M18.5 18L21.5 21" stroke='currentColor' strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2.5 20C2.5 16.134 5.63401 13 9.5 13C10.775 13 11.9704 13.3409 13 13.9365" stroke='currentColor' strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

export const UserIcon = ({className, onClick, size=24}: IconProps) => {
    return (
        <svg onClick={onClick} className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} color='currentColor' fill="none">
            <path d="M17 8.5C17 5.73858 14.7614 3.5 12 3.5C9.23858 3.5 7 5.73858 7 8.5C7 11.2614 9.23858 13.5 12 13.5C14.7614 13.5 17 11.2614 17 8.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
            <path d="M19 20.5C19 16.634 15.866 13.5 12 13.5C8.13401 13.5 5 16.634 5 20.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
    )
}

export const RequestIcon = ({className, onClick, size=24}: IconProps) => {
    return (
       <svg onClick={onClick} className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} color='currentColor' fill="none">
            <path d="M2 5L8.91302 8.92462C11.4387 10.3585 12.5613 10.3585 15.087 8.92462L22 5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"></path>
            <path d="M21.996 10.5024C21.9933 10.1357 21.9894 9.77017 21.9842 9.5265C21.9189 6.46005 21.8862 4.92682 20.7551 3.79105C19.6239 2.65528 18.0497 2.61571 14.9012 2.53658C12.9607 2.48781 11.0393 2.48781 9.09882 2.53657C5.95033 2.6157 4.37608 2.65526 3.24495 3.79103C2.11382 4.92681 2.08114 6.46003 2.01576 9.52648C1.99474 10.5125 1.99475 11.4926 2.01577 12.4786C2.08114 15.5451 2.11383 17.0783 3.24496 18.2141C4.37608 19.3498 5.95033 19.3894 9.09883 19.4685C9.7068 19.4838 10.4957 19.4943 11 19.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
            <path d="M15.586 18.6482C14.9572 19.0167 13.3086 19.7693 14.3127 20.711C14.8032 21.171 15.3495 21.5 16.0364 21.5H19.9556C20.6424 21.5 21.1887 21.171 21.6792 20.711C22.6834 19.7693 21.0347 19.0167 20.4059 18.6482C18.9314 17.7839 17.0605 17.7839 15.586 18.6482Z" stroke="currentColor" strokeWidth="1.5"></path>
            <path d="M19.996 14C19.996 15.1046 19.1005 16 17.996 16C16.8914 16 15.996 15.1046 15.996 14C15.996 12.8954 16.8914 12 17.996 12C19.1005 12 19.996 12.8954 19.996 14Z" stroke="currentColor" strokeWidth="1.5"></path>
        </svg>
    )
}

export const CheckIcon = ({className, onClick, size=24}: IconProps) => {
    return (
       <svg onClick={onClick} className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} color='currentColor' fill="none">
            <path d="M5 14.5C5 14.5 6.5 14.5 8.5 18C8.5 18 14.0588 8.83333 19 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
    )
}

export const XIcon = ({className, onClick, size=24}: IconProps) => {
    return (
        <svg onClick={onClick} className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} color='currentColor' fill="none">
            <path d="M18 6L6.00081 17.9992M17.9992 18L6 6.00085" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
    )
}
export const GearsIcon = ({className, onClick, size=24}: IconProps) => {
    return (
        <svg onClick={onClick} className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} color='currentColor' fill="none">
            <path d="M15.5 12C15.5 13.933 13.933 15.5 12 15.5C10.067 15.5 8.5 13.933 8.5 12C8.5 10.067 10.067 8.5 12 8.5C13.933 8.5 15.5 10.067 15.5 12Z" stroke="currentColor" strokeWidth="1.5" />
            <path d="M21.011 14.0965C21.5329 13.9558 21.7939 13.8854 21.8969 13.7508C22 13.6163 22 13.3998 22 12.9669V11.0332C22 10.6003 22 10.3838 21.8969 10.2493C21.7938 10.1147 21.5329 10.0443 21.011 9.90358C19.0606 9.37759 17.8399 7.33851 18.3433 5.40087C18.4817 4.86799 18.5509 4.60156 18.4848 4.44529C18.4187 4.28902 18.2291 4.18134 17.8497 3.96596L16.125 2.98673C15.7528 2.77539 15.5667 2.66972 15.3997 2.69222C15.2326 2.71472 15.0442 2.90273 14.6672 3.27873C13.208 4.73448 10.7936 4.73442 9.33434 3.27864C8.95743 2.90263 8.76898 2.71463 8.60193 2.69212C8.43489 2.66962 8.24877 2.77529 7.87653 2.98663L6.15184 3.96587C5.77253 4.18123 5.58287 4.28891 5.51678 4.44515C5.45068 4.6014 5.51987 4.86787 5.65825 5.4008C6.16137 7.3385 4.93972 9.37763 2.98902 9.9036C2.46712 10.0443 2.20617 10.1147 2.10308 10.2492C2 10.3838 2 10.6003 2 11.0332V12.9669C2 13.3998 2 13.6163 2.10308 13.7508C2.20615 13.8854 2.46711 13.9558 2.98902 14.0965C4.9394 14.6225 6.16008 16.6616 5.65672 18.5992C5.51829 19.1321 5.44907 19.3985 5.51516 19.5548C5.58126 19.7111 5.77092 19.8188 6.15025 20.0341L7.87495 21.0134C8.24721 21.2247 8.43334 21.3304 8.6004 21.3079C8.76746 21.2854 8.95588 21.0973 9.33271 20.7213C10.7927 19.2644 13.2088 19.2643 14.6689 20.7212C15.0457 21.0973 15.2341 21.2853 15.4012 21.3078C15.5682 21.3303 15.7544 21.2246 16.1266 21.0133L17.8513 20.034C18.2307 19.8187 18.4204 19.711 18.4864 19.5547C18.5525 19.3984 18.4833 19.132 18.3448 18.5991C17.8412 16.6616 19.0609 14.6226 21.011 14.0965Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    )
}

export const LogOutIcon = ({className, onClick, size=24}: IconProps) => {
    return (
        <svg className={className} onClick={onClick} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} color='currentColor' fill="none">
            <path d="M18.5 4.40041C16.752 2.9039 14.4815 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C14.4815 22 16.752 21.0961 18.5 19.5996" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M18 8C18 8 22 10.946 22 12C22 13.0541 18 16 18 16M21.5 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

export const CameraIcon = ({className, onClick, size=24}: IconProps) => {
    return (
        <svg className={className} onClick={onClick} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} color="currentColor" fill="none">
            <path d="M22 14.5V8.27201C22 7.01721 20.9828 6 19.728 6C19.2679 6 18.8327 5.79084 18.5452 5.43154L18 4.75C17.6086 4.26074 17.4129 4.01611 17.1647 3.84705C16.9991 3.73428 16.8176 3.64702 16.6261 3.58819C16.3391 3.5 16.0258 3.5 15.3992 3.5H13.6008C12.9742 3.5 12.6609 3.5 12.3739 3.58819C12.1824 3.64702 12.0009 3.73428 11.8353 3.84705C11.5871 4.01611 11.3914 4.26074 11 4.75C10.6086 5.23926 10.4129 5.48389 10.1647 5.65295C9.99914 5.76572 9.81759 5.85298 9.62612 5.91181C9.33906 6 9.02578 6 8.39922 6H8C5.17157 6 3.75736 6 2.87868 6.87868C2 7.75736 2 9.17157 2 12V14.5C2 17.3284 2 18.7426 2.87868 19.6213C3.75736 20.5 5.17157 20.5 8 20.5H16C18.8284 20.5 20.2426 20.5 21.1213 19.6213C22 18.7426 22 17.3284 22 14.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 9H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M18.5309 13C18.5309 15.2091 16.74 17 14.5309 17C12.3217 17 10.5309 15.2091 10.5309 13C10.5309 10.7909 12.3217 9 14.5309 9C16.74 9 18.5309 10.7909 18.5309 13Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}