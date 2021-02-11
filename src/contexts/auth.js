import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { signIn as sendSignInRequest } from '../api/auth';

function AuthProvider(props) {
  const [user, setUser] = useState();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // (async  () =>{
      // const result = await getUser();
      // if (result.isOk) {
      //   setUser(result.data);
      // }
       setLoading(false);
    //})();
  }, []);

  const signIn = useCallback(async (email, password) => {
    const result = await sendSignInRequest(email, password);
    if (result.isOk) {
      setUser(result.data);
    }

    return result;
  }, []);

  const signOut = useCallback(() => {
    setUser();
  }, []);


  return (
    <AuthContext.Provider value={{ user, signIn, signOut, loading }} {...props} />
  );
}

const AuthContext = createContext({});
const useAuth = () => useContext(AuthContext);

export { AuthProvider, useAuth }
