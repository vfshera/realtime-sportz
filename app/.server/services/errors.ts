export type NotFoundError = {
  type: "NOT_FOUND";
  resource: string;
  id: string;
};

export type DatabaseError = {
  type: "DATABASE_ERROR";
  message: string;
};

export type ServiceError = NotFoundError | DatabaseError;

export const notFound = (resource: string, id: string): NotFoundError => ({
  type: "NOT_FOUND",
  resource,
  id,
});

export const databaseError = (message: string): DatabaseError => ({
  type: "DATABASE_ERROR",
  message,
});
