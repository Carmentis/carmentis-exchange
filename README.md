# Carmentis Exchange

## Launch in production mode (using docker-compose)
We recommend the installation of the Exchange server using docker-compose. 
Below is presented an example of docker-compose.yml file: 
```yml
version: '3.8'

services:
   back:
      image: ghcr.io/carmentis/exchange/back:latest
      container_name: carmentis-exchange-back
      restart: always
      environment:
         - ISSUER_KEYPAIR_FILE=/app/config/issuer-keypair.json
         - NODE_URL=NODE_URL
         - PORT=3000
      volumes:
         - ./keys:/app/config
      ports:
         - "5003:3000"

   front:
      image: ghcr.io/carmentis/exchange/front:latest
      container_name: carmentis-exchange-front
      restart: always
      environment:
         - EXCHANGE_API=EXCHANGE_API
         - PORT=3000
      ports:
         - "5004:3000"
      depends_on:
         - back

```

## Launch in production mode (using Docker)

To run the Exchange server in **production mode** using Docker, each of the `back` and `front` Docker images are assumed
to be available. Below are the steps to run both services manually with Docker, including the `PORT` environment
variable for configuration:

### Steps:

1. **Launch the Back-End Docker Container:**
    - Run the container in production mode:
      ```bash
      docker run -d -p 3001:3001 --env NODE_URL=http://localhost:3000 --env PORT=3001 --name carmentis-exchange-back ghcr.io/carmentis/exchange/back:latest
      ```
      Here:
        - `-p 3001:3001` maps the back-end to the production port `3001`.
        - `--env NODE_URL=http://localhost:3000` ensures the service is connected to a running node at
          `http://localhost:3000`.
        - `--env PORT=3001` explicitly sets the port that the back-end service will use.

2. **Launch the Front-End Docker Container:**
    - Run the container in production mode:
      ```bash
      docker run -d -p 3002:3002 --env EXCHANGE_API=http://localhost:3001/api --env PORT=3002 --name carmentis-exchange-front ghcr.io/carmentis/exchange/front:latest
      ```
      Here:
        - `-p 3002:3002` maps the front-end to the production port `3002`.
        - `--env EXCHANGE_API=http://localhost:3001/api` configures the front-end to interact with the back-end's API.
        - `--env PORT=3002` explicitly sets the port that the front-end service will use.

Now the back-end should be running on `http://localhost:3001`, while the front-end is accessible at
`http://localhost:3002`.

**Note:** Ensure Docker is properly installed and running before proceeding.

## Authentication System

The Carmentis Control application uses a wallet-based authentication system where users authenticate by signing a challenge with their private key. The system now includes an SSH-like authorized keys feature for enhanced security.

### Authorized Keys Feature

Similar to SSH, users can only authenticate if their public key is listed in the `authorized_keys` file. This provides an additional layer of security by restricting access to only authorized users.

#### Configuration

The authorized keys feature is configured using the `CONTROL_STORAGE` environment variable:

```bash
# Directory for storing control-related files (issuer keypair and authorized keys)
CONTROL_STORAGE=/path/to/control/storage
```

If not specified, it defaults to `./control-storage` in the current working directory.

The system uses two important files:
- `authorized_keys`: Contains the list of authorized public keys (one per line)
- `control_key_pair.json`: Contains the issuer's key pair (previously configured with `ISSUER_KEYPAIR_FILE`)

#### Adding Authorized Keys

To add a public key to the authorized keys list:

1. Locate the `authorized_keys` file in your `CONTROL_STORAGE` directory
2. Add the user's public key as a new line in the file
3. Save the file

Example `authorized_keys` file:
```
04a9c47c0c7b80a8b...
04e8d92c3f6a91b7c...
```

#### Docker Configuration

When using Docker, make sure to mount the control storage directory:

```yml
services:
   back:
      image: ghcr.io/carmentis/exchange/back:latest
      environment:
         - CONTROL_STORAGE=/app/config
         - NODE_URL=NODE_URL
         - PORT=3000
      volumes:
         - ./control-storage:/app/config
```

## Launch in development mode
In development mode, two terminals are required, one for the back and another for
the front. 

**Disclaimer**: Be aware that the exchange needs a running node to be executed. In the provided commands below,
we assume that the running node is listening at `http://localhost:3000`.

1. Launch the back using the command `NODE_URL=http://localhost:3000 PORT=3001 cd back && npm run start:dev`
2. Launch the front using the command `EXCHANGE_API=http://localhost:3001/api PORT=3002 npm run dev`