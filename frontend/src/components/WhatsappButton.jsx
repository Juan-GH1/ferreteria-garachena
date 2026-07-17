import { MessageCircle } from 'lucide-react';

export default function WhatsappButton() {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <a
        href="https://wa.me/56912345678?text=Hola%20Ferreter%C3%ADa%20Garachena,%20necesito%20cotizar%20un%20producto."
        target="_blank"
        rel="noreferrer"
        className="bg-[#25D366] hover:bg-[#20ba5a] text-white p-4.5 rounded-full shadow-2xl flex items-center justify-center transition hover:scale-110 duration-300 w-14 h-14"
      >
        <MessageCircle className="w-6 h-6" />
      </a>
    </div>
  );
}
