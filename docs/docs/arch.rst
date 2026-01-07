=================
 Architecture
=================

.. image:: diagrams/arch-overview.png
  :width: 800
  :alt: Overview of the architecture of node-oauth2-server

The above diagrams depicts the main parts of the node-oauth2-server library and their relations.

The OAuth2Server class is the main entry point to the library. It is initialized with a model that implements the methods required by the OAuth 2.0 specification.
The model is responsible for interacting with the data store, such as a database, to manage clients, tokens, and other resources.

For each of the major functions there is a specific **handler** class that handles interacts with requests and generates responses:

- **Authenticate**: The `AuthenticateHandler` class handles the authentication of requests using access tokens. It also allows to delegate the authentication process to an external handler.
- **Authorize**: The `AuthorizeHandler` class handles the authorization code grant flow. It processes the request to authorize a client and generates an authorization code.
- **Token**: The `TokenHandler` class handles the token grant flow. It processes requests to issue access tokens, refresh tokens, and other related operations.
