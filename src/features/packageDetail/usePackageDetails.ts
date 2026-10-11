import { useCallback, useEffect, useRef, useState } from "react";
import {
  getNpmPackageDetails,
  getNpmPackageVersionDetails,
  isValidNpmPackageName,
} from "../../services/npmRegistry/npmRegistryService";
import {
  NpmRegistryError,
  type PackageDetails,
  type PackageVersionDetails,
} from "../../services/npmRegistry/types";

export type PackageDetailsRequestState =
  | { status: "loading"; packageName: string }
  | { status: "invalid-name"; packageName: string }
  | { status: "error"; packageName: string; error: NpmRegistryError }
  | { status: "success"; packageName: string; details: PackageDetails };

export type PackageVersionRequestState =
  | { status: "idle" }
  | { status: "loading"; version: string }
  | { status: "error"; version: string; error: NpmRegistryError }
  | { status: "success"; version: string; details: PackageVersionDetails };

function toNpmRegistryError(error: unknown): NpmRegistryError {
  return error instanceof NpmRegistryError
    ? error
    : new NpmRegistryError("unknown", { cause: error });
}

function firstAvailableVersion(details: PackageDetails): string {
  return details.latestVersion ?? "";
}

function versionCacheKey(packageName: string, version: string): string {
  return `${packageName}\u0000${version}`;
}

export function usePackageDetails(packageName: string) {
  const [state, setState] = useState<PackageDetailsRequestState>({
    status: "loading",
    packageName,
  });
  const [selectedVersion, setSelectedVersion] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [versionRetryKey, setVersionRetryKey] = useState(0);
  const [versionState, setVersionState] = useState<PackageVersionRequestState>({
    status: "idle",
  });
  const requestSequence = useRef(0);
  const packageController = useRef<AbortController | null>(null);
  const versionController = useRef<AbortController | null>(null);
  const versionCache = useRef(new Map<string, PackageVersionDetails>());

  useEffect(() => {
    const requestId = ++requestSequence.current;
    packageController.current?.abort();
    versionController.current?.abort();
    packageController.current = null;
    versionController.current = null;
    versionCache.current.clear();
    setSelectedVersion("");
    setVersionState({ status: "idle" });

    if (!isValidNpmPackageName(packageName)) {
      setState({ status: "invalid-name", packageName });
      return;
    }

    const controller = new AbortController();
    packageController.current = controller;
    setState({ status: "loading", packageName });

    void getNpmPackageDetails(packageName, { signal: controller.signal })
      .then((details) => {
        if (requestId !== requestSequence.current || controller.signal.aborted) return;
        if (details.latestVersionDetails) {
          versionCache.current.set(
            versionCacheKey(packageName, details.latestVersionDetails.version),
            details.latestVersionDetails,
          );
        }
        setState({ status: "success", packageName, details });
        setSelectedVersion(firstAvailableVersion(details));
      })
      .catch((error: unknown) => {
        if (requestId !== requestSequence.current || controller.signal.aborted) return;
        const registryError = toNpmRegistryError(error);
        if (registryError.code !== "aborted") {
          setState({ status: "error", packageName, error: registryError });
        }
      });

    return () => {
      controller.abort();
      if (packageController.current === controller) packageController.current = null;
      versionController.current?.abort();
      versionController.current = null;
    };
  }, [packageName, retryKey]);

  const details =
    state.status === "success" && state.packageName === packageName
      ? state.details
      : undefined;

  useEffect(() => {
    versionController.current?.abort();
    versionController.current = null;

    if (!details || !selectedVersion) {
      setVersionState({ status: "idle" });
      return;
    }

    const cacheKey = versionCacheKey(packageName, selectedVersion);
    const cached = versionCache.current.get(cacheKey);
    if (cached) {
      setVersionState({
        status: "success",
        version: selectedVersion,
        details: cached,
      });
      return;
    }

    const controller = new AbortController();
    versionController.current = controller;
    setVersionState({ status: "loading", version: selectedVersion });

    void getNpmPackageVersionDetails(packageName, selectedVersion, {
      signal: controller.signal,
    })
      .then((versionDetails) => {
        if (controller.signal.aborted) return;
        versionCache.current.set(cacheKey, versionDetails);
        if (versionCache.current.size > 12) {
          const oldestKey = versionCache.current.keys().next().value;
          if (oldestKey) versionCache.current.delete(oldestKey);
        }
        setVersionState({
          status: "success",
          version: selectedVersion,
          details: versionDetails,
        });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const registryError = toNpmRegistryError(error);
        if (registryError.code !== "aborted") {
          setVersionState({
            status: "error",
            version: selectedVersion,
            error: registryError,
          });
        }
      });

    return () => {
      controller.abort();
      if (versionController.current === controller) versionController.current = null;
    };
  }, [details, packageName, selectedVersion, versionRetryKey]);

  const retry = useCallback(() => {
    setRetryKey((current) => current + 1);
  }, []);
  const retryVersion = useCallback(() => {
    setVersionRetryKey((current) => current + 1);
  }, []);

  const selectVersion = useCallback((version: string) => {
    setSelectedVersion(version);
  }, []);

  return {
    state,
    details,
    selectedVersion,
    versionState,
    selectVersion,
    retry,
    retryVersion,
  };
}
