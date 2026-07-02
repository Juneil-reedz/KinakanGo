import { MessageSquare } from 'lucide-react';

export default function Messages() {
  return (
    <div className="h-full flex flex-col animate-fade-up">
      <h1 className="text-2xl font-heading font-bold text-white mb-4">Messages</h1>
      <div className="glass rounded-3xl flex-1 flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3 text-center">
          <MessageSquare className="w-14 h-14 text-forest-300/30" />
          <p className="text-white font-semibold">No messages yet</p>
          <p className="text-forest-200/50 text-sm">Messages from restaurants will appear here.</p>
        </div>
      </div>
    </div>
  );
}
