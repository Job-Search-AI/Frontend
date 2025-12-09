"use client";

import { useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [needsFollowUp, setNeedsFollowUp] = useState(false);
  const [prevEntity, setPrevEntity] = useState(null);

  const addMessage = (content, role) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        role,
        content,
      },
    ]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    addMessage(userMessage, "user");

    setIsLoading(true);

    try {
      const endpoint = needsFollowUp ? "/follow_up" : "/query";
      const payload = needsFollowUp
        ? { user_input: userMessage, prev_entity: prevEntity }
        : { user_input: userMessage };

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();

      if (data.status === "incomplete") {
        const botText = data.message || "추가 정보를 입력해 주세요.";
        addMessage(botText, "bot");
        setNeedsFollowUp(true);
        setPrevEntity(data.normalized_entities || null);
      } else if (data.status === "success") {
        const botText = data.user_response || "결과를 가져왔습니다.";
        addMessage(botText, "bot");
        setNeedsFollowUp(false);
        setPrevEntity(null);
      } else {
        addMessage("알 수 없는 응답 형식입니다.", "bot");
      }
    } catch (err) {
      console.error(err);
      addMessage(
        "서버 요청 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
        "bot"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col gradient-bg overflow-hidden">
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="glass-card px-8 py-6 border-b border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl neon-border">
              <span role="img" aria-label="target">
                🎯
              </span>
            </div>
            <div>
              <h1
                id="site-title"
                className="text-3xl font-bold text-white mb-1"
              >
                AI Career Finder
              </h1>
              <p id="site-subtitle" className="text-sm text-gray-400">
                당신의 커리어를 위한 최적의 기회를 찾아드립니다
              </p>
            </div>
          </div>
        </header>

        <div
          id="chat-container"
          className="flex-1 overflow-y-auto scroll-custom px-8 py-6"
        >
          <div id="chat-messages" className="max-w-5xl mx-auto space-y-6">
            <div className="message-enter flex gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl glass-card flex-shrink-0">
                <span role="img" aria-label="bot">
                  🤖
                </span>
              </div>
              <div className="flex-1">
                <div className="glass-card rounded-2xl p-6 neon-border">
                  <p className="text-gray-300 leading-relaxed">
                    안녕하세요! AI 채용공고 검색 플랫폼입니다. 🚀
                    <br />
                    <br />
                    원하시는
                    <span className="text-blue-400 font-semibold">
                      직무, 지역, 경력
                    </span>
                    등 조건을 입력해주시면
                    <br />
                    최적의 채용공고를 찾아드리겠습니다.
                    <br />
                    <br />
                    예시:
                    <span className="text-purple-400">
                      "서울, 백엔드 개발자, 3년 경력"
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`message-enter flex gap-4 ${
                  msg.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                {msg.role === "bot" && (
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl glass-card flex-shrink-0">
                    <span role="img" aria-label="bot">
                      🤖
                    </span>
                  </div>
                )}
                <div className="flex-1 flex">
                  <div
                    className={`glass-card rounded-2xl p-5 max-w-2xl ${
                      msg.role === "user" ? "ml-auto" : "neon-border"
                    }`}
                    style={
                      msg.role === "user"
                        ? {
                            background: "rgba(59, 130, 246, 0.15)",
                            border: "1px solid rgba(59, 130, 246, 0.3)",
                          }
                        : {}
                    }
                  >
                    <p
                      className={
                        msg.role === "user"
                          ? "text-white leading-relaxed"
                          : "text-gray-300 leading-relaxed"
                      }
                    >
                      {msg.content}
                    </p>
                  </div>
                </div>
                {msg.role === "user" && (
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl glass-card flex-shrink-0">
                    <span role="img" aria-label="user">
                      👤
                    </span>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl glass-card flex-shrink-0">
                  <span role="img" aria-label="bot">
                    🤖
                  </span>
                </div>
                <div className="glass-card rounded-2xl neon-border">
                  <div className="typing-dots">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="glass-card border-t border-gray-700 px-8 py-6">
          <form
            id="chat-form"
            className="max-w-5xl mx-auto"
            onSubmit={handleSubmit}
          >
            <div className="flex gap-4">
              <input
                type="text"
                id="user-input"
                placeholder="원하는 직무, 지역, 경력 등을 입력하세요..."
                className="flex-1 px-6 py-4 rounded-xl input-modern text-white placeholder-gray-500 focus:outline-none text-base"
                aria-label="채용 조건 입력"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                required
              />
              <button
                type="submit"
                id="send-button"
                className="px-8 py-4 rounded-xl font-bold text-white btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                <span className="flex items-center gap-2">
                  <span id="button-text">
                    {isLoading ? "검색 중..." : "검색"}
                  </span>
                  <span role="img" aria-label="search">
                    🔍
                  </span>
                </span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
