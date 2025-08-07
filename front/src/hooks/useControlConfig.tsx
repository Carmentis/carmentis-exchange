import useApiConfig from "@/hooks/useApiConfig";

export function useControlConfig() {
  const {EXCHANGE_API} = useApiConfig();
  const CONTROL_API = EXCHANGE_API + '/api/control';
  return {
    CONTROL_API,
  };
}