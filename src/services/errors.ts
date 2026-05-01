// Centralised error helpers for Firestore + API operations.

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export class TenantOperationError extends Error {
  constructor(
    message: string,
    public readonly operation: OperationType,
    public readonly path: string | null,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'TenantOperationError';
  }
}

export function logFirestoreError(
  error: unknown,
  operation: OperationType,
  path: string | null,
): never {
  const info = {
    error: error instanceof Error ? error.message : String(error),
    operation,
    path,
  };
  console.error('[Firestore]', JSON.stringify(info));
  throw new TenantOperationError(info.error, operation, path, error);
}
