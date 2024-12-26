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
