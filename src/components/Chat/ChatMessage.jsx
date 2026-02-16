export const ChatMessage = ({ message, isUser }) => {
  if (isUser) {
    return (
      <div className="flex justify-end mb-6">
        <div className="bg-primary text-primary-foreground rounded-3xl rounded-tr-none px-5 py-2.5 max-w-[70%] text-[15px] shadow-sm font-medium">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-6">
      <div className="text-foreground text-[15px] leading-relaxed whitespace-pre-wrap font-medium max-w-[85%] px-2">
        {message.content}
      </div>
    </div>
  );
};
