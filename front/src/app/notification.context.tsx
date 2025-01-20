import { PropsWithChildren } from 'react';
import { toast, ToastContainer } from 'react-toastify';



/**
 * Provides a notification context by wrapping the given children with a ToastContainer.
 * This enables toast notifications throughout the children components.
 *
 * @param {PropsWithChildren} props - The component props which include React children to be rendered within the provider.
 * @return {JSX.Element} The JSX element containing the ToastContainer and wrapped children components.
 */
export function NotificationContextProvider({children}: PropsWithChildren) {
	return <>
		<ToastContainer/>
		{children}
	</>
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