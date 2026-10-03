export function success(data) {
  return {
    success: true,
    data,
  };
}

export function failure(
  message,
  code
) {
  return {
    success: false,
    error: {
      message,
      code,
    },
  };
}