import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useControlConfig } from './useControlConfig';
import { toast } from 'react-toastify';

interface NodeStatus {
  address: string;
  url: string;
  status: any;
  version?: string;
}

interface UseConnectedNodeReturn {
  nodeInfo: NodeStatus | null;
  loading: boolean;
  error: Error | null;
  fetchNodeInfo: () => Promise<void>;
}

export function useConnectedNode(): UseConnectedNodeReturn {
  const { CONTROL_API } = useControlConfig();
  const [nodeInfo, setNodeInfo] = useState<NodeStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Get the auth token from localStorage
  const getAuthToken = () => localStorage.getItem('controlAuthToken');

  // Fetch connected node information
  const fetchNodeInfo = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await axios.get(`${CONTROL_API}/connected-node`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNodeInfo(response.data);
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error : new Error(String(error));
      setError(errorMessage);
      toast.error('Failed to fetch connected node information');
      throw errorMessage;
    } finally {
      setLoading(false);
    }
  }, [CONTROL_API]);

  // Fetch node information on mount
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      fetchNodeInfo().catch(console.error);
    }
  }, [fetchNodeInfo]);

  return {
    nodeInfo,
    loading,
    error,
    fetchNodeInfo,
  };
}