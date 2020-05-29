import {
  APIGatewayProxyEvent,
  APIGatewayEventRequestContext,
  APIGatewayEvent,
  APIGatewayProxyCallback,
} from 'aws-lambda';

export type Method =
  | 'get'
  | 'GET'
  | 'delete'
  | 'DELETE'
  | 'head'
  | 'HEAD'
  | 'post'
  | 'POST'
  | 'put'
  | 'PUT'
  | 'patch'
  | 'PATCH'
  | 'options'
  | 'OPTIONS';

interface PathPrefixHandler {
  (path: string): string;
}

interface ErrorCallback {
  (error: Error): LambdogResponse;
}

type PathPrefix = string | RegExp | PathPrefixHandler;

export interface LambdogServerConfig {
  contentEncoder?: (body: any) => LambdogResponse;
  contentType?: string;
  pathToProps?: string;
  pathPrefix?: PathPrefix;
  errorCallback?: ErrorCallback;
  maxAge?: number;
}

type KeyValue<T = string> = {
  [key: string]: T;
};

type LambdogResponse = {
  statusCode?: number;
  body?: string;
  headers?: KeyValue;
  isBase64Encoded?: boolean;
};

// type Event = {
//   path: string;
//   httpMethod: Method;
//   headers: KeyValue;
//   queryStringParameters: KeyValue;
//   body: string;
//   isBase64Encoded: boolean;
// };

type Event = APIGatewayProxyEvent;
type Context = APIGatewayEventRequestContext;
type Callback = APIGatewayProxyCallback;

export type LambdogArgs = {
  event: Event;
  params: KeyValue;
  props: KeyValue<any>;
  query: KeyValue<any>;
  body: any;
};

interface LambdogHandler {
  (props: KeyValue<any>, args: LambdogArgs): Promise<LambdogResponse>;
}

export type LambdogRoute = {
  method?: Method;
  path: string;
  middleware?: any[];
  handler?: LambdogHandler;
  children?: LambdogRoute[];
};

export function withJSONHandler(
  handler: LambdogHandler,
  config?: LambdogServerConfig
): (
  event: Event,
  context: Context,
  callback: Callback
) => Promise<LambdogResponse>;

export function withJSONHandler(
  routes: LambdogRoute[],
  config?: LambdogServerConfig
): (
  event: Event,
  context: Context,
  callback: Callback
) => Promise<LambdogResponse>;

export function withHandler(
  handler: LambdogHandler,
  config?: LambdogServerConfig
): (
  event: Event,
  context: Context,
  callback: Callback
) => Promise<LambdogResponse>;

export function withHandler(
  routes: LambdogRoute[],
  config?: LambdogServerConfig
): (
  event: Event,
  context: Context,
  callback: Callback
) => Promise<LambdogResponse>;
