===========================
 Migrating to 5.x
===========================

This guide covers the most breaking changes, in case you updated from an earlier version.

-------------------
Requires Node >= 16
-------------------

Due to Node 14 reaching end of life (EOL; which implies no security updates) this version requires at least Node 16.
Future versions of the 5.x major releases will update to a newer Node LTS, once the current one reaches EOL.

Note, that we also won't regard any security patches to problems that are a direct consequence of
using a Node version that reached EOL.

------------------------
Removed callback support
------------------------

With beginning of release 5.0.0 this module dropped all callback support and uses `async/await`
for all asynchronous operations.

This implies you either need to have a more recent Node.js environment that natively supports `async/await`
or your project uses tools to support at least Promises.

-----------------
Update your model
-----------------

The model functions is now expected to return a Promise (or being declared as `async function`),
since callback support is dropped.

Note: Synchronous model functions are still supported. However, we recommend to use Promise or async,
if database operations (or other heavy operations) are part of a specific model function implementation.

------------------
Scope is now Array
------------------

In earlier versions we allowed `scope` to be strings with words, separated by empty space.
With beginning of 5.0.0 the scope parameter needs to be an Array of strings.

This implies to requests, responses and model implementations where scope is included.
