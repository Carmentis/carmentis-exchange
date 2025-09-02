import {useEffect} from "react";
import {useLocalStorage} from "react-use";

export function useTokenJWT() {
    const [token, setToken, clearToken] = useLocalStorage<string>("controlAuthToken", "");


    useEffect(() => {
        console.debug(`Token has changed: ${token}`);
    }, [token]);

    return {token, hasToken: token !== '',  setToken, clearToken};
}