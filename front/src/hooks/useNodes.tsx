import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useControlConfig } from './useControlConfig';
import { toast } from 'react-toastify';

interface Node {
  id: string;
  name: string;
  publicKey: string;
  endpoint: string;
  isValidator: boolean;
  status: 'pending' | 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

interface UseNodesReturn {
  nodes: Node[];
  loading: boolean;
  error: Error | null;
  fetchNodes: () => Promise<void>;
  setAsValidator: (id: string) => Promise<void>;
  removeAsValidator: (id: string) => Promise<void>;
}

export function useNodes(): UseNodesReturn {
  const { CONTROL_API } = useControlConfig();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Get the auth token from localStorage
  const getAuthToken = () => localStorage.getItem('controlAuthToken');

  // Fetch all nodes
  const fetchNodes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await axios.get(`${CONTROL_API}/nodes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNodes(response.data);
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error : new Error(String(error));
      setError(errorMessage);
      toast.error('Failed to fetch nodes');
      throw errorMessage;
    } finally {
      setLoading(false);
    }
  }, [CONTROL_API]);

  // Set a node as a validator
  const setAsValidator = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      await axios.put(`${CONTROL_API}/nodes/${id}/validator`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Refresh the nodes list
      await fetchNodes();
      toast.success('Node set as validator successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error : new Error(String(error));
      setError(errorMessage);
      toast.error('Failed to set node as validator');
      throw errorMessage;
    } finally {
      setLoading(false);
    }
  };

  // Remove a node as a validator
  const removeAsValidator = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      await axios.delete(`${CONTROL_API}/nodes/${id}/validator`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Refresh the nodes list
      await fetchNodes();
      toast.success('Node removed as validator successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error : new Error(String(error));
      setError(errorMessage);
      toast.error('Failed to remove node as validator');
      throw errorMessage;
    } finally {
      setLoading(false);
    }
  };

  // Fetch nodes on mount
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      fetchNodes().catch(console.error);
    }
  }, [fetchNodes]);

  return {
    nodes,
    loading,
    error,
    fetchNodes,
    setAsValidator,
    removeAsValidator,
  };
}