# Carmentis Exchange

## Launch the exchange server in development mode
In development mode, two terminals are required, one for the back and another for
the front. 

**Disclaimer**: Be aware that the exchange needs a running node to be executed. In the provided commands below,
we assume that the running node is listening at `http://localhost:3000`.

1. Launch the back using the command `NODE_URL=http://localhost:3000 PORT=3001 cd back && npm run start:dev`
2. Launch the front using the command `EXCHANGE_API=http://localhost:3001/api PORT=3002 npm run dev`