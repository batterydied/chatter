import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthPage from './pages/AuthPage/AuthPage';
import HomePage from './pages/HomePage/HomePage';
import { useState, useEffect } from 'react'
import { auth } from './config/firebase'
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth'
import usePresence from './hooks/usePresence'
import { Toaster } from 'sonner'

function App() {
  const [user, setUser] = useState<User | null>(null);

  auth.useDeviceLanguage()

  const logIn = async () => {
      try{
          const provider = new GoogleAuthProvider()
          const result = await signInWithPopup(auth, provider)
          const user = result.user
          console.log(user)
      }catch(e){
          if(e instanceof Error){
              console.log(e.message)
          }else{
              console.log('An error occurred')
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

  const logOut = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <>
      <Toaster richColors position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<AuthPage user={user} logIn={logIn}/>} />
          <Route path='/home' element={<HomePage user={user} logOut={logOut}/>} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
