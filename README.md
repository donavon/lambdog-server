<div align="center">
<img
  height="200"
  width="200"
  alt="part lamb, part dog"
  src="https://user-images.githubusercontent.com/887639/56451023-b2ef9280-62f7-11e9-8897-7de261cf0797.png"
/>
<p>It's part lamb. It's part dog. It's Lambdog.</p>
</div>

Ok, so what IS Lambdog? Lambdog is a set of packages (one for the client, and one for the server)
that makes it easy to call and write Lambda functions for AWS. You can use either one independently, or use them together.

## @lambdog/server

@lambdog/server consists of a higher order function that
you can use to wrap your plain JavaScript function that will do all of the work to turn it into
an AWS Lambda function. You concentrate on your code, let Lambdog do the rest.

Let's look at a quick example. Say you have a "Hello World" function that you would
like to run on the server. It should be as simple as this.

```js
const hello = ({name = 'World'}) => `Hello, ${name}!`;
```

I say "should" because that's not all you have to do. To make it a Lambda function,
there are a few more things you need to do.

First, you must create an object with a `statusCode` property set to 200 (OK).
Next, you take the results from calling `hello` and assign that to the `body` property,
but first, you must `JSON.stringify` it. Then you call the callback function with the results.

Whew! That'a a lot of "plumbing" for a simple "Hello World" function. And you can barely even
see your core function.
Whatever happened to the design principle talking about the
[separation of concerns](https://en.wikipedia.org/wiki/Separation_of_concerns)?
And exactly what is `queryStringParameters` anyway? ¯\\_(ツ)_/¯

```js
export function handler(event, context, callback) {
  callback(null, {
    statusCode: 200,
    body: JSON.stringify(
      `Hello, ${event.queryStringParameters.name || 'World'}!`
    ),
  });
}
```

### Enter Lambdog

With Lambdog, we can take our simple `hello` function from above, wrap it and export it.
The plumbing is hidden away. You don't have to concern yourself with HTTP, status codes, headers, or caching.

```js
import { withJSONHandler } from '@lambdog/server';

const hello = ({name = 'World'}) => `Hello, ${name}!`;

export const handler = withJSONHandler(hello);
```

You would call this from your client by doing a GET to `/hello?name=Joe`.

### Other benefits

Oh, and there are a few other benefits that you get out of the box—for free.

* Your return value is automatically `JSON.stringify`'ed and added to `body`.

* Automatic `etag`/`if-none-match` generation/matching to return a 304 status code means fewer bits pass over the wire.

* If your function is "pure" (i.e. has no side effects), there is an optional setting that allows you to set "max-age" caching.

* Automatic `try`/`catch` to produce 500 server errors.

* Support for `props` based on query parameters, URL pattern matching (i.e. /hello/:name), or POST data.

## Installation

```bash
$ npm i @lambdog/server
```

or

```bash
$ yarn add @lambdog/server
```

## Usage

Here is a basic setup.

```js
import { withJSONHandler } from '@lambdog/server';

export const handler = withJSONHandler(function, config);
```

### Parameters

Here are the parameters that you can use.

| Parameter   | Description                                                  |
| :---------- | :------------------------------------------------ |
| `function` |  The function to wrap. See below for passed parameters. |
| `config` | An optional configuration object.  |

### Return

`withJSONHandler` returns a function that can be exported as `handler`.

### Configuration object

The configuration object has the following options.

| Parameter   | Description                                                  |
| :---------- | :------------------------------------------------ |
| `pathToProps` |  A string used for URL pattern matching. For example, if you want the URL `/hello/World` to call your `hello` function and pass "World" as the `name` prop, set `pathToProps` to "hello/:name" |
| `errorCallback` | A callback function that you can use to format an error.  |
| `maxAge` | The `max-age` that the client can cache the response. Set to -1 (default) if you don't want the response cached.  |

## Your function

### Parameters

Your function will be called with two arguments. The first is a consolidated `props` object. It is built from query parameters, URL pattern matching (i.e. /hello/:name), and POST data, in that order.

The second argument is the original `event` object passed to the `handler`.
Use this as your "escape hatch" in case your function needs to know more about
how it was called. For example, you can check for a particular header value.

### Throwing

If you throw an error, Lambdog will, by default (unless you set `errorCallback` in config), format a status code of 500
with the error message as the body.

If you throw an object, Lambdog will return that object "as-it".
This is your response escape hatch.

### Return value

Your function can return a value directly, or it can be an `async` function
what resolves to a value.

The results from your function will be JSON stringified and
placed in the body.
An `etag` hash of the body will also be included in the header.

Lambdog will also set the content type to `application/json`.

## License

**[MIT](LICENSE)** Licensed
