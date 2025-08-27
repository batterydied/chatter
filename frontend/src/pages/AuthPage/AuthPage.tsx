import { Navigate } from 'react-router-dom';
import { useAppContext } from '../../hooks/useAppContext';
import Spline from '@splinetool/react-spline';
import type { JSX } from 'react';

const AuthPage = () => {
  const { user, logIn } = useAppContext();
  let splineScene: JSX.Element | null = null;

  try {
    splineScene = (
      <Spline scene="https://prod.spline.design/5DvbVl2fOfUp5M5R/scene.splinecode" />
    );
  } catch (e) {
    console.error('Spline failed to load:', e);
    splineScene = null;
  }

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
        {splineScene}
      </div>
    </div>
  );
};

export default AuthPage;
