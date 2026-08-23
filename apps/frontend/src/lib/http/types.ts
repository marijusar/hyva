export interface HttpResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
}
