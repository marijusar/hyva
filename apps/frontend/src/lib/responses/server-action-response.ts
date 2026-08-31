export const ServerActionStatuses = {
  success: "success",
  error: "error",
  idle: "idle",
} as const;

type ServerActionResponseParams<T> = {
  data: T;
  error: string | null;
  status: keyof typeof ServerActionStatuses;
  code?: string | null;
};

export type ServerActionResponsePayload<T> = ServerActionResponseParams<T>;

export class ServerActionResponse {
  static create<T>(params: ServerActionResponseParams<T>) {
    return {
      ...params,
    };
  }
}

export const createDefaultServerActionResponse = <T>(data: T) =>
  ServerActionResponse.create({
    error: null,
    status: ServerActionStatuses.idle,
    data,
  });
