# Authentication Modal Context

This context provides a reusable modal component that can be used throughout the application, particularly for wallet authentication flows.

## Features

- Show/hide a modal with custom content
- Authenticate users with their wallet using QR codes or wallet extensions
- Provides a hook for easy access to modal functionality

## Implementation Details

### AuthModalContext

The `AuthModalContext` provides the following:

- `showModal(content: ReactNode)`: Shows the modal with the provided content
- `hideModal()`: Hides the modal
- `authenticateByPublicKey(challenge: string, onSuccess, onError)`: Shows a modal with authentication UI and handles the wallet authentication flow
- `isOpen`: Boolean indicating whether the modal is currently open
- `isLoading`: Boolean indicating whether an authentication operation is in progress

### AuthModalProvider

The `AuthModalProvider` component wraps your application and renders the modal. It should be placed in your application layout, typically inside the `AuthProvider` so it can access the authentication context if needed.

```tsx
<AuthProvider>
  <AuthModalProvider>
    {children}
  </AuthModalProvider>
</AuthProvider>
```

### useAuthModal Hook

The `useAuthModal` hook allows components to access the modal context:

```tsx
const { showModal, hideModal, authenticateByPublicKey, isOpen, isLoading } = useAuthModal();
```

## Usage Examples

### Showing a Simple Modal

```tsx
const { showModal } = useAuthModal();

const handleShowModal = () => {
  showModal(
    <Box>
      <Typography variant="h6">Modal Title</Typography>
      <Typography>Modal content goes here.</Typography>
      <Button onClick={hideModal}>Close</Button>
    </Box>
  );
};
```

### Authenticating with a Wallet

```tsx
const { authenticateByPublicKey } = useAuthModal();

const handleAuthenticate = () => {
  authenticateByPublicKey(
    'Sign this message to authenticate: challenge',
    (signature, publicKey) => {
      console.log('Authentication successful', { signature, publicKey });
      // Handle successful authentication
    },
    (error) => {
      console.error('Authentication failed', error);
      // Handle authentication error
    }
  );
};
```

## Integration with Authentication Flow

The modal context is integrated with the authentication flow in the `useControlAuth` hook. When a user tries to log in, the `signChallenge` function uses the `authenticateByPublicKey` function from the modal context to show a modal with a QR code and wallet extension button for the user to authenticate.

## Testing

A test page is available at `/control/test-modal` to verify the modal functionality. This page allows you to:

1. Show a simple modal with custom content
2. Trigger the authentication modal with a custom challenge
3. View the authentication result (signature and public key) when authentication is successful

This test page is useful for development and testing purposes but would not be exposed to end users in a production environment.