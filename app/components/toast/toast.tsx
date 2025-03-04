import { XMarkIcon } from "@heroicons/react/20/solid";
import toast from "react-hot-toast";

export function customToast(content: React.ReactNode) {
  toast.custom((t) => (
    <div
      className={`${
        t.visible ? "animate-enter" : "animate-leave"
      } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 justify-between p-3 gap-x-3`}
    >
      {content}
      <button onClick={() => toast.dismiss(t.id)} className="flex items-center">
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  ));
}
