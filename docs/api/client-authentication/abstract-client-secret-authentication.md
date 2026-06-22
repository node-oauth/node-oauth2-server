<a name="AbstractClientSecretAuthentication"></a>

## *AbstractClientSecretAuthentication ⇐ <code>AbstractClientAuthentication</code>*
Shared behaviour for the secret-based methods (`client_secret_basic`,
`client_secret_post`): validate the credential format, then delegate
verification of the secret to `model.getClient(clientId, clientSecret)`.

Subclasses differ only in how the credentials are carried on the wire
(`getCredentials`).

**Kind**: global abstract class  
**Extends**: <code>AbstractClientAuthentication</code>  
<a name="AbstractClientSecretAuthentication+getCredentials"></a>

### **abstractClientSecretAuthentication.getCredentials(request) ⇒ <code>Object</code>**
Extract `{ clientId, clientSecret }` from the request for this transport.

**Kind**: instance abstract method of [<code>AbstractClientSecretAuthentication</code>](#AbstractClientSecretAuthentication)  

| Param | Type |
| --- | --- |
| request | <code>Request</code> | 

