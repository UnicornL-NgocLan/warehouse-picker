export const getErrorMessage = (error: unknown): string => {
  let message: string;

  if (typeof error === "object" && error !== null && "response" in error) {
    const resData = (error as any).response?.data;
    message = resData?.msg || resData?.message || (error as Error).message || "Có lỗi xảy ra";
  } else if (error instanceof Error) {
    message = (error as any).response?.data?.msg || error.message || "Có lỗi xảy ra";
  } else if (typeof error === "string") {
    message = error;
  } else {
    message = "Có lỗi xảy ra";
  }

  return message;
};
