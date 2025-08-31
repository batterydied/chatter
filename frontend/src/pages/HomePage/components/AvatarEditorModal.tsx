import { useRef } from 'react'
import AvatarEditor from 'react-avatar-editor'

type AvatarEditorModalProps = {
    img: string,
    scale: number,
    setScale: (scale: number) => void,
    setPreviewUrl: (filePath: string) => void, 
    setShouldOpenAvatarEditor: (bool: boolean) => void
    setImgBlob: (blob: Blob) => void
}

const AvatarEditorModal = ({img, scale, setScale, setPreviewUrl, setShouldOpenAvatarEditor, setImgBlob}: AvatarEditorModalProps) => {
    const editorRef = useRef<AvatarEditor>(null)
    const handleSave = () => {
        
        if (editorRef.current) {
        const canvas = editorRef.current.getImageScaledToCanvas()

        canvas.toBlob(async (blob) => {
            if (blob) {
                const url = URL.createObjectURL(blob);
                setPreviewUrl(url);
                setImgBlob(blob)
            }
        }, "image/png")
        }
        setShouldOpenAvatarEditor(false)
    }

    const handleCancel = () => {
        setPreviewUrl('')
        setShouldOpenAvatarEditor(false)
    }

    return (
        <div>
            <div className='flex w-full justify-center'>
                <AvatarEditor
                image={img}
                width={180}
                height={180}
                border={20}
                color={[255, 255, 255, 0.6]} // RGBA
                scale={scale}
                rotate={0}
                borderRadius={125}
                ref={editorRef}
                />
            </div>
            <div className='flex flex-col justify-center items-center mt-2'>
                <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.01"
                    value={scale}
                    onChange={(e) => setScale(parseFloat(e.target.value))}
                />
                <div>
                    <button className='btn m-2 bg-red-800' onClick={handleCancel}>Cancel</button>
                    <button className='btn m-2' onClick={handleSave}>Apply</button>
                </div>
            </div>
        </div>
    )
}

export default AvatarEditorModal
