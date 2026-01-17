"use client";

import { createContext, ReactNode, useContext, useState } from "react";

type ConfirmOptions = {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
};

type ConfirmContextType = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx)
    throw new Error("useConfirm must be used inside ConfirmDialogProvider");
  return ctx; // returns { confirm }
};

export default function ConfirmDialogProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [resolver, setResolver] = useState<(value: boolean) => void>(() => {});
  const [options, setOptions] = useState<ConfirmOptions>({});

  const confirm = (opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);

    return new Promise((resolve) => {
      setResolver(() => resolve);
    });
  };

  const handleResponse = (value: boolean) => {
    setIsOpen(false);
    resolver(value);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 w-[480px] shadow-xl">
            <h2 className="text-lg font-semibold mb-2">
              {options.title || "Are you sure?"}
            </h2>
            <p className="text-gray-600 mb-4">
              {options.message || "This action cannot be undone."}
            </p>

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 border rounded-md text-gray-700"
                onClick={() => handleResponse(false)}
              >
                {options.cancelText || "Cancel"}
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-md"
                onClick={() => handleResponse(true)}
              >
                {options.confirmText || "Yes, Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
