// lib/toastr.ts
import toast from "react-hot-toast";

export const Toastr = {
  success(message: string) {
    toast.success(message, {
      duration: 3000,
      position: "top-right",
    });
  },

  error(message: string) {
    toast.error(message, {
      duration: 4000,
      position: "top-right",
    });
  },

  info(message: string) {
    toast(message, {
      duration: 3500,
      position: "top-right",
      icon: "ℹ️",
    });
  },

  loading(message: string) {
    return toast.loading(message, {
      position: "top-right",
    });
  },

  remove(id: string) {
    toast.dismiss(id);
  },
};
