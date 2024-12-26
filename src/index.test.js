import { describe, it, expect, vi, beforeEach } from "vitest";
import { getLocation, savePageToKv, fetchPageFromKv } from ".";

describe("getLocation", () => {
  it("should return location data when CF data is present", () => {
    const mockRequest = {
      cf: {
        country: "DE",
      },
    };
    const result = getLocation(mockRequest);

    expect(result).toEqual({
      status: "success",
      country: "DE",
    });
  });

  it("should return return an error when all data is undefined", () => {
    const mockRequest = {};

    const result = getLocation(mockRequest);

    expect(result).toEqual({
      status: "error",
    });
  });

  // The plugin can also take an options object with a setting for the "mode" of obtaining the user location. Options would be latlon or country. The default is country.

  it("should return the lat lon when the options object is set to latlon", () => {
    const mockRequest = {
      cf: {
        latitude: 1,
        longitude: 2,
      },
    };

    const result = getLocation(mockRequest, { mode: "latlon" });

    expect(result).toEqual({
      status: "success",
      lat: 1,
      lon: 2,
    });
  });

  it("should return the country when the options object is not set", () => {
    const mockRequest = {
      cf: {
        country: "DE",
      },
    };

    const result = getLocation(mockRequest);

    expect(result).toEqual({
      status: "success",
      country: "DE",
    });
  });

  it("should return the country when the options object is set incorrectly", () => {
    const mockRequest = {
      cf: {
        country: "DE",
      },
    };

    //@ts-expect-error
    const result = getLocation(mockRequest, { mode: "invalid" });

    expect(result).toEqual({
      status: "success",
      country: "DE",
    });
  });
});

describe("savePageToKv", () => {
  let mockEnv = {
    GAW_PAGE_KV: {
      put: vi.fn().mockResolvedValue(undefined),
      get: vi.fn().mockResolvedValue(undefined),
      list: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      getWithMetadata: vi.fn().mockResolvedValue(undefined),
    },
  };

  const mockResponse = {
    status: 200,
    headers: {},
    statusText: "OK",
    body: "test response body",
  };

  it("should successfully save a response to KV", async () => {

    const result = await savePageToKv(mockEnv, "testKey", mockResponse);

    expect(mockEnv.GAW_PAGE_KV.put).toHaveBeenCalledWith("testKey", "test response body");
    expect(result).toBeUndefined();
  });

  it("should return error when required parameters are missing", async () => {
    //@ts-expect-error
    const result = await savePageToKv(undefined, "key", {});
    expect(result).toEqual({ status: "error" });

    //@ts-expect-error
    const result2 = await savePageToKv({}, undefined, {});
    expect(result2).toEqual({ status: "error" });

    //@ts-expect-error
    const result3 = await savePageToKv({}, "key", undefined);
    expect(result3).toEqual({ status: "error" });
  });

  it("should return error when KV binding is missing", async () => {
    const mockEnv = {};
    //@ts-expect-error
    const result = await savePageToKv(mockEnv, "key", { body: "test" });

    expect(result).toEqual({
      status: "error",
      message: "GAW_PAGE_KV not found in environment. Please create it.",
    });
  });

  it("should return error when KV storage fails", async () => {
    mockEnv = {
      GAW_PAGE_KV: {
        put: vi.fn().mockRejectedValue(new Error("Storage error")),
        get: vi.fn().mockResolvedValue(undefined),
        list: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
        getWithMetadata: vi.fn().mockResolvedValue(undefined),
      },
    };

    const result = await savePageToKv(mockEnv, "testKey", mockResponse);

    expect(result).toEqual({ status: "error" });
  });
});

describe("fetchPageFromKv", () => {
  let mockEnv;

  beforeEach(() => {
    mockEnv = {
      GAW_PAGE_KV: {
        get: vi.fn().mockResolvedValue("stored content"),
        put: vi.fn().mockResolvedValue(undefined),
        list: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
        getWithMetadata: vi.fn().mockResolvedValue(undefined),
      },
    };
  });

  it("should successfully fetch content from KV", async () => {
    const result = await fetchPageFromKv(mockEnv, "testKey");
    
    expect(mockEnv.GAW_PAGE_KV.get).toHaveBeenCalledWith("testKey");
    expect(result).toBe("stored content");
  });

  it("should return error when required parameters are missing", async () => {
    const result = await fetchPageFromKv(undefined, "key");
    expect(result).toEqual({ status: "error" });

    const result2 = await fetchPageFromKv(mockEnv, undefined);
    expect(result2).toEqual({ status: "error" });
  });

  it("should return error when KV binding is missing", async () => {
    const emptyEnv = {};
    //@ts-expect-error
    const result = await fetchPageFromKv(emptyEnv, "key");

    expect(result).toEqual({
      status: "error",
      message: "GAW_PAGE_KV not found in environment. Please create it.",
    });
  });

  it("should return null when content is not found", async () => {
    mockEnv.GAW_PAGE_KV.get.mockResolvedValue(null);
    const result = await fetchPageFromKv(mockEnv, "nonexistent");
    
    expect(result).toBeNull();
  });

  it("should handle KV errors gracefully", async () => {
    mockEnv.GAW_PAGE_KV.get.mockResolvedValue(null);
    const result = await fetchPageFromKv(mockEnv, "testKey");
    
    expect(mockEnv.GAW_PAGE_KV.get).toHaveBeenCalledWith("testKey");
    expect(result).toBe(null);
  });
});
