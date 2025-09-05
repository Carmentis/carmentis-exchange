'use client';

import { createContext, PropsWithChildren, useContext } from 'react';

import {useExchangeConfig} from "@/hooks/useExchangeConfig";

/**
 * Represents a connection interface for interacting with a specific node or network.
 *
 * This interface defines the structure for a connection, primarily holding the URL of the node
 * that a client or system can use to connect to for communication or data interaction.
 *
 * The `nodeUrl` property can be either a string containing the node URL or undefined if no URL is set.
 *
 * Example usage or additional details are omitted based on requested constraints.
 *
 * Properties:
 * - `nodeUrl`: Optional string representing the URL of the node. It can also be undefined if a connection URL is not initialized.
 */
export interface ConnectionInterface {
	nodeUrl: string | undefined,
	loading: boolean,
	error: Error | null,
}

/**
 * Represents a context for managing connection-related state or information
 * that is shared between components. This context is used to provide and consume
 * a `ConnectionInterface` or `undefined`, enabling components to communicate
 * effectively within the connection scope.
 *
 * The `ConnectionContext` is typically initialized with `undefined` and later
 * populated with a valid `ConnectionInterface` instance as needed.
 *
 * Use this context to access or update connection-specific details across
 * component trees without the need for direct prop drilling.
 */
export const ConnectionContext = createContext<ConnectionInterface|undefined>(undefined);

/**
 * Provides a context for managing connection details such as the `nodeUrl`.
 * It uses the useExchangeConfig hook to fetch and manage the nodeUrl state.
 *
 * @param {PropsWithChildren} props - The properties object with children components.
 * @return {JSX.Element} A provider component wrapping the children with the connection context.
 */
export function ConnectionContextProvider({children}: PropsWithChildren) {
	// Use the new hook which handles loading and error states
	const { nodeUrl, loading, error } = useExchangeConfig();

	return <ConnectionContext.Provider value={{nodeUrl, loading, error}}>
		{children}
	</ConnectionContext.Provider>
}

/**
 * Retrieves the node URL from the ConnectionContext. This hook must be used within
 * a ConnectionContextProvider. If used outside of the provider, an error will be thrown.
 */
export function useConnectionNodeUrl() {
    const { nodeUrl, loading, error } = useExchangeConfig();
    return {nodeUrl, loading}
}
