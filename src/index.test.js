import { describe, it, expect, vi, beforeEach } from "vitest";
import { getLocation, savePageToKv, fetchPageFromKv, fetchDataFromKv, saveDataToKv } from ".";
import * as exp from "constants";

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
  let mockEnv;
  const mockResponse = {
    status: 200,
    headers: {},
    statusText: "OK",
    body: "test response body",
  };

  beforeEach(() => {
    mockEnv = {
      GAW_PAGE_KV: {
        put: vi.fn().mockResolvedValue(undefined),
      },
    };
  });

  it("should successfully save a response to KV with default TTL", async () => {
    await expect(savePageToKv(mockEnv, "testKey", mockResponse)).resolves.toBeUndefined();
    expect(mockEnv.GAW_PAGE_KV.put).toHaveBeenCalledWith(
      "testKey", 
      "test response body", 
      { expirationTtl: 86400 }
    );
  });

  it("should save with custom TTL when provided", async () => {
    await expect(
      savePageToKv(mockEnv, "testKey", mockResponse, { expirationTtl: 3600 })
    ).resolves.toBeUndefined();
    
    expect(mockEnv.GAW_PAGE_KV.put).toHaveBeenCalledWith(
      "testKey", 
      "test response body", 
      { expirationTtl: 3600 }
    );
  });

  it("should use default TTL when provided TTL is not a number", async () => {
    await expect(
      // @ts-expect-error
      savePageToKv(mockEnv, "testKey", mockResponse, { expirationTtl: "1hour" })
    ).resolves.toBeUndefined();
    
    expect(mockEnv.GAW_PAGE_KV.put).toHaveBeenCalledWith(
      "testKey", 
      "test response body", 
      { expirationTtl: 86400 }
    );
  });

  it("should reject when KV storage fails", async () => {
    mockEnv.GAW_PAGE_KV.put.mockRejectedValue(new Error("Storage error"));
    
    await expect(savePageToKv(mockEnv, "testKey", mockResponse)).rejects.toBeUndefined();
  });
});

describe("fetchPageFromKv", () => {
  let mockEnv;

  beforeEach(() => {
    mockEnv = {
      GAW_PAGE_KV: {
        get: vi.fn().mockResolvedValue("stored content"),
      },
    };
  });

  it("should successfully fetch content from KV", async () => {
    const result = await fetchPageFromKv(mockEnv, "testKey");
    
    expect(mockEnv.GAW_PAGE_KV.get).toHaveBeenCalledWith("testKey");
    expect(result).toBe("stored content");
  });

  it("should handle KV fetch errors", async () => {
    mockEnv.GAW_PAGE_KV.get.mockRejectedValue(new Error("Fetch error"));
    await expect(fetchPageFromKv(mockEnv, "testKey")).rejects.toThrow("Fetch error");
  });

  it("should return null when content is not found", async () => {
    mockEnv.GAW_PAGE_KV.get.mockResolvedValue(null);
    const result = await fetchPageFromKv(mockEnv, "nonexistent");
    
    expect(result).toBeNull();
  });

  it("should pass through different content types", async () => {
    const testCases = [
      { input: "string content", expected: "string content" },
      { input: new Uint8Array([1, 2, 3]), expected: new Uint8Array([1, 2, 3]) },
      { input: { foo: "bar" }, expected: { foo: "bar" } },
      { input: null, expected: null }
    ];

    for (const { input, expected } of testCases) {
      mockEnv.GAW_PAGE_KV.get.mockResolvedValue(input);
      const result = await fetchPageFromKv(mockEnv, "testKey");
      expect(result).toEqual(expected);
    }
  });
});

describe("fetchDataFromKv", () => {
  let mockEnv;

  beforeEach(() => {
    mockEnv = {
      GAW_DATA_KV: {
        get: vi.fn().mockResolvedValue("stored data"),
      },
    };
  });

  it("should successfully fetch data from KV", async () => {
    const result = await fetchDataFromKv(mockEnv, "country-DE");
    
    expect(mockEnv.GAW_DATA_KV.get).toHaveBeenCalledWith("country-DE");
    expect(result).toBe("stored data");
  });

  it("should handle KV fetch errors", async () => {
    mockEnv.GAW_DATA_KV.get.mockRejectedValue(new Error("Fetch error"));
    await expect(fetchDataFromKv(mockEnv, "testKey")).rejects.toThrow("Fetch error");
  });

  it("should return null when data is not found", async () => {
    mockEnv.GAW_DATA_KV.get.mockResolvedValue(null);
    const result = await fetchDataFromKv(mockEnv, "nonexistent");
    
    expect(result).toBeNull();
  });

  it("should pass through different data types", async () => {
    const testCases = [
      { input: "string data", expected: "string data" },
      { input: new Uint8Array([1, 2, 3]), expected: new Uint8Array([1, 2, 3]) },
      { input: { value: 123 }, expected: { value: 123 } },
      { input: null, expected: null }
    ];

    for (const { input, expected } of testCases) {
      mockEnv.GAW_DATA_KV.get.mockResolvedValue(input);
      const result = await fetchDataFromKv(mockEnv, "testKey");
      expect(result).toEqual(expected);
    }
  });

  it("should handle missing KV binding", async () => {
    const mockEnvWithoutKV = {};
    await expect(fetchDataFromKv(mockEnvWithoutKV, "testKey"))
      .rejects
      .toThrow(TypeError);
  });
});

describe("saveDataToKv", () => {
  let mockEnv;

  beforeEach(() => {
    mockEnv = {
      GAW_DATA_KV: {
        put: vi.fn().mockResolvedValue(undefined),
      },
    };
  });

  it("should successfully save string data with default TTL", async () => {
    const testData = "test data";
    await expect(saveDataToKv(mockEnv, "country-DE", testData)).resolves.toBeUndefined();
    expect(mockEnv.GAW_DATA_KV.put).toHaveBeenCalledWith(
      "country-DE",
      testData,
      { expirationTtl: 3600 } // 1 hour default
    );
  });

  it("should save with custom TTL when provided", async () => {
    const testData = "test data";
    await expect(
      saveDataToKv(mockEnv, "country-DE", testData, { expirationTtl: 7200 })
    ).resolves.toBeUndefined();
    
    expect(mockEnv.GAW_DATA_KV.put).toHaveBeenCalledWith(
      "country-DE",
      testData,
      { expirationTtl: 7200 }
    );
  });

  it("should handle different data types", async () => {
    const testCases = [
      "string data",
      new Uint8Array([1, 2, 3]),
      new TextEncoder().encode("encoded text"),
      new ReadableStream(),
    ];

    for (const data of testCases) {
      await saveDataToKv(mockEnv, "testKey", data);
      expect(mockEnv.GAW_DATA_KV.put).toHaveBeenCalledWith(
        "testKey",
        data,
        { expirationTtl: 3600 }
      );
    }
  });

  it("should use default TTL when provided TTL is not a number", async () => {
    const testData = "test data";
    await expect(
      // @ts-expect-error
      saveDataToKv(mockEnv, "testKey", testData, { expirationTtl: "2hours" })
    ).resolves.toBeUndefined();
    
    expect(mockEnv.GAW_DATA_KV.put).toHaveBeenCalledWith(
      "testKey",
      testData,
      { expirationTtl: 3600 }
    );
  });

  it("should handle KV errors", async () => {
    mockEnv.GAW_DATA_KV.put.mockRejectedValue(new Error("Storage error"));
    await expect(
      saveDataToKv(mockEnv, "testKey", "test data")
    ).rejects.toThrow("Storage error");
  });

  it("should handle missing KV binding", async () => {
    const mockEnvWithoutKV = {};
    await expect(
      // @ts-expect-error
      saveDataToKv(mockEnvWithoutKV, "testKey", "test data")
    ).rejects.toThrow(TypeError);
  });
});

