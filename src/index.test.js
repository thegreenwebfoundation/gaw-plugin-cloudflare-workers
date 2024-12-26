import { describe, it, expect, vi } from "vitest";
import { getLocation, savePageToKv } from ".";
import { get } from "http";
import { stat } from "fs";

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

    // @ts-ignore
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
    // @ts-ignore
    const result = await savePageToKv(undefined, "key", {});
    expect(result).toEqual({ status: "error" });

    // @ts-ignore
    const result2 = await savePageToKv({}, undefined, {});
    expect(result2).toEqual({ status: "error" });

    // @ts-ignore
    const result3 = await savePageToKv({}, "key", undefined);
    expect(result3).toEqual({ status: "error" });
  });

  it("should return error when KV binding is missing", async () => {
    const mockEnv = {};
    // @ts-ignore
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
