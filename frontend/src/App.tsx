import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthPage from './pages/AuthPage/AuthPage';
import HomePage from './pages/HomePage/HomePage';
import { useState, useEffect, useCallback } from 'react'
import { auth } from './config/firebase'
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth'
import usePresence from './hooks/usePresence'
import { Toaster } from 'sonner'
import { ref, serverTimestamp, set } from 'firebase/database';
import { rtdb } from './config/firebase';
import useSummaryStatus from './hooks/useSummaryStatus';
import { AppContext } from './hooks/useAppContext';

function App() {
  const [user, setUser] = useState<User | null>(null);

  auth.useDeviceLanguage()

  const logIn = async () => {
      try{
          const provider = new GoogleAuthProvider()
          await signInWithPopup(auth, provider)
      }catch(e){
          if(e instanceof Error){
              console.error(e.message)
          }else{
              console.error('An error occurred')
          }
      }
  }

  useEffect(()=>{
      const unsubscribe = onAuthStateChanged(auth, (user) => {
          if(user){
              setUser(user)
          } else {
              console.log('Not signed in')
          }
      });
      return unsubscribe
  }, [])
  
  usePresence(user);
  useSummaryStatus(user);

  const logOut = useCallback(async () => {
    const user = auth.currentUser;
    const sessionId = sessionStorage.getItem('firebaseSessionId');

    setUser(null);
    if (user && sessionId) {
      const userStatusRef = ref(rtdb, `status/${user.uid}/${sessionId}`);

      // Set user offline explicitly
      await set(userStatusRef, {
        state: 'offline',
        last_changed: serverTimestamp(),
      });
    }

    await signOut(auth);
  }, [])

  return (
    <>
      <Toaster richColors position="top-right" />
      <BrowserRouter>
        <AppContext.Provider value={{user, logIn, logOut}}>
          <Routes>
            <Route path='/' element={<AuthPage />} />
            <Route path='/home' element={<HomePage />} />
          </Routes>
        </AppContext.Provider>
      </BrowserRouter>
    </>
  )
}

export default App
