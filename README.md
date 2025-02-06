# Carmentis Exchange

## Launch in production mode (using docker-compose)
We recommend the installation of the Exchange server using docker-compose. 

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

## Launch in development mode
In development mode, two terminals are required, one for the back and another for
the front. 

**Disclaimer**: Be aware that the exchange needs a running node to be executed. In the provided commands below,
we assume that the running node is listening at `http://localhost:3000`.

1. Launch the back using the command `NODE_URL=http://localhost:3000 PORT=3001 cd back && npm run start:dev`
2. Launch the front using the command `EXCHANGE_API=http://localhost:3001/api PORT=3002 npm run dev`