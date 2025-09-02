import {useControlAuth} from "@/hooks/useControlAuth";
import {useMemo, useState} from "react";
import axios from "axios";
import {useControlConfig} from "@/hooks/useControlConfig";
import {useTokenJWT} from "@/hooks/useTokenJWT";

export default function useAuthenticatedApiClient() {
    const {token, hasToken} = useTokenJWT();
    const {CONTROL_API} = useControlConfig();

    console.log("Token: ", token)
    const api = useMemo(() => {
        if (!hasToken) console.warn("No token found");
        return axios.create({
            baseURL: CONTROL_API,
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
            },
        })
    }, [hasToken]);

    return {client: api, isAuthenticated: token !== null}
}