# Carmentis Exchange

## Launch the exchange server in development mode
In development mode, two terminals are required, one for the back and another for
the front.

1. Launch the back using the command `PORT=3001 cd back && npm run start:dev`
2. Launch the front using the command `EXCHANGE_API=http://localhost:3001/api PORT=3002 npm run dev`