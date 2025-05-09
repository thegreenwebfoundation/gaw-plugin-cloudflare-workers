import {
  KVNamespace,
  Response as CFResponse,
  ExecutionContext,
  Request as CFRequest,
} from "@cloudflare/workers-types";

export type locationOptions = {
  mode?: "country" | "latlon";
};

export type cloudflareRequest = CFRequest;

export type locationResponse = {
  country?: string;
  lat?: number;
  lon?: number;
  status: "success" | "error";
};

export type cloudflareEnv = {
  GAW_PAGE_KV?: KVNamespace;
  GAW_DATA_KV?: KVNamespace;
};

export type cloudflareResponse = {
  status: number;
  statusText: string;
  headers: {
    [key: string]: string;
  };
  body: string;
};

export type kvOptions = {
  expirationTtl?: number; // in seconds
};

export type cloudflareContext = ExecutionContext;
