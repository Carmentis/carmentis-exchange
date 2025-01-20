'use client';

import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';
import { useExchangeConfig } from '@/app/api';

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
 * It fetches and sets the `nodeUrl` from the exchange configuration.
 *
 * @param {PropsWithChildren} props - The properties object with children components.
 * @return {JSX.Element} A provider component wrapping the children with the connection context.
 */
export function ConnectionContextProvider({children}: PropsWithChildren) {
	const [nodeUrl, setNodeUrl] = useState<string|undefined>(undefined);

	useEffect(() => {
		useExchangeConfig()
			.then(nodeUrl => setNodeUrl(nodeUrl))
	}, []);

	return <ConnectionContext.Provider value={{nodeUrl}}>
		{children}
	</ConnectionContext.Provider>
}

/**
 * Retrieves the node URL from the ConnectionContext. This hook must be used within
 * a ConnectionContextProvider. If used outside of the provider, an error will be thrown.
 *
 * @return {string | undefined} The node URL from the connection context, or undefined if not available.
 */
export function useConnectionNodeUrl(): string | undefined {
	const context = useContext(ConnectionContext);
	if (!context) throw new Error("Cannot use useConnectionNodeUrl outside of ConnectionContextProvider")
	return context.nodeUrl;
}