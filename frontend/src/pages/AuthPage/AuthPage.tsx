import { Navigate } from 'react-router-dom';
import { useAppContext } from '../../hooks/useAppContext';
import Spline from '@splinetool/react-spline';

const isWebGLAvailable = (): boolean => {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
};

const AuthPage = () => {
  const { user, logIn } = useAppContext();
  const canUseWebGL = isWebGLAvailable()

  if (user) return <Navigate to="/home" />;

  return (
    <div className="bg-black overscroll-none flex justify-center items-center h-screen w-screen relative">
      <div className="absolute animate-fade-in flex flex-col items-center gap-4">
        <div className="text-7xl font-bold hover:cursor-default">Chatter</div>
        <button className="border p-2 rounded-md border-transparent hover:border-accent hover:cursor-pointer" onClick={logIn}>
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
