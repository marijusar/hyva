import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebouncedFn } from "./use-debounced-fn";

describe("useDebouncedFn", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("only invokes fn once after the delay, with the latest args", () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useDebouncedFn(fn, 200));

    act(() => {
      result.current("first");
      result.current("second");
      result.current("third");
    });
    expect(fn).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("third");
  });

  it("resets the timer on rapid successive calls instead of firing per-call", () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useDebouncedFn(fn, 200));

    act(() => {
      result.current("a");
    });
    act(() => {
      vi.advanceTimersByTime(150);
      result.current("b");
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("b");
  });
});
