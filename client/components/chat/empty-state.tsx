import { FileSearch } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-xl"
        style={{ backgroundColor: "rgba(245, 214, 107, 0.1)" }}
      >
        <FileSearch className="h-5 w-5" style={{ color: "#F5D66B" }} />
      </div>
      <h2 className="text-[15px] font-medium text-[#EDEDEC]">
        Nothing asked yet
      </h2>
      <p className="max-w-sm text-[13px] leading-relaxed text-[#8C8C93]">
        Ask a question about the documents in this chat. Every answer comes with
        the exact passage it was pulled from.
      </p>
    </div>
  );
}
