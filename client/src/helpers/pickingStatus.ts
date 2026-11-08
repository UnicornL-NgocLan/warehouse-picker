export const getPickingStateTag = (state: string): { label: string; color: string } => {
  switch (state) {
    case "draft":
      return { label: "Nháp", color: "default" };
    case "waiting":
      return { label: "Chờ thao tác khác", color: "warning" };
    case "confirmed":
      return { label: "Chờ có hàng", color: "processing" };
    case "assigned":
      return { label: "Sẵn sàng", color: "success" };
    case "done":
      return { label: "Hoàn thành", color: "default" };
    case "cancel":
      return { label: "Đã hủy", color: "error" };
    default:
      return { label: state || "Không rõ", color: "default" };
  }
};

