import { Navigate } from 'react-router-dom';
import { useAppContext } from '../../hooks/useAppContext';
import Spline from '@splinetool/react-spline';
import { useEffect, useState } from 'react';

const AuthPage = () => {
  const { user, logIn } = useAppContext();
  const [canUseWebGL, setCanUseWebGL] = useState(false);

  // Detect WebGL2 support and check for low-end / Intel GPUs
  useEffect(() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return; // WebGL2 not supported

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';
    
    // Skip known problematic GPUs (Intel / ANGLE / old drivers)
    if (renderer && /Intel/i.test(renderer)) return;

    setCanUseWebGL(true);
  }, []);

  if (user) return <Navigate to="/home" />;

  return (
    <div className="bg-black overflow-hidden flex justify-center items-center h-screen w-screen relative touch-none overscroll-none">
      {/* UI Overlay */}
      <div className="absolute animate-fade-in flex flex-col items-center gap-4 z-10">
        <div className="text-7xl font-bold hover:cursor-default">Chatter</div>
        <button
          className="border p-2 rounded-md border-transparent hover:border-accent hover:cursor-pointer"
          onClick={logIn}
        >
          Sign in with Google
        </button>
      </div>

      <div className="w-full h-full">
        {canUseWebGL && 
          <Spline scene="https://prod.spline.design/5DvbVl2fOfUp5M5R/scene.splinecode" />
        }
      </div>
    </div>
  );
};

export default AuthPage;
