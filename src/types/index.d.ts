import { KVNamespace } from "@cloudflare/workers-types";

export type locationOptions = {
  mode?: "country" | "latlon";
};

export type cloudflareRequest = {
  cf?: {
    country?: string;
    latitude?: number;
    longitude?: number;
  };
};

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
  expirationTtl?: number;
};
