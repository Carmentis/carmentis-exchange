import { PropsWithChildren } from 'react';
import { toast } from 'react-toastify';

/**
 * Provides a notification context for the application.
 * The ToastContainer is now added in the layout.tsx file.
 *
 * @param {PropsWithChildren} props - The component props which include React children to be rendered within the provider.
 * @return {JSX.Element} The JSX element containing the wrapped children components.
 */
export function NotificationContextProvider({children}: PropsWithChildren) {
	return <>{children}</>;
}

/**
 * Provides a simplified interface for displaying toast notifications.
 *
 * @return {Object} An object containing methods for triggering toast notifications.
 *         - success(message: string): Displays a success toast with the specified message.
 *         - error(message: string): Displays an error toast with the specified message.
 */
export function useToast() {
	return {
		success: (message: string) => toast.success(message),
		error: (message: string) => toast.error(message)
	}
}
