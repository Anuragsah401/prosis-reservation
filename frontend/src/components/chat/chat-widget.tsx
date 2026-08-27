import { useState, useRef, useEffect } from "react"
import { useLocation, Link } from "react-router-dom"
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  ArrowRight,
  RotateCcw,
  ChevronDown,
  CheckCheck,
  UserCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { matchChatQuery, type ChatAction } from "./chat-knowledge"

// Set owner's WhatsApp number here (E.164 digits without + or spaces)
const OWNER_WHATSAPP_NUMBER = "15557328266"
const OWNER_DISPLAY_PHONE = "+1 (555) 732-8266"

interface Message {
  id: string
  sender: "bot" | "user"
  text: string
  timestamp: string
  actions?: ChatAction[]
  followUps?: string[]
}

interface WhatsAppChatMessage {
  id: string
  sender: "owner" | "visitor"
  text: string
  time: string
  status?: "delivered" | "sent"
}

function WhatsAppIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="currentColor"
      className={className}
    >
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm5.79 14.07c-.24.68-1.4 1.29-1.95 1.36-.51.07-1.16.1-3.34-.81-2.78-1.15-4.57-3.99-4.71-4.17-.14-.19-1.14-1.52-1.14-2.9 0-1.38.72-2.06.97-2.35.25-.29.56-.36.75-.36.19 0 .37.01.53.02.17.01.4.06.62.53.24.51.81 1.98.88 2.12.07.15.12.32.02.51-.1.2-.15.32-.3.49-.15.17-.31.38-.45.51-.15.15-.31.31-.13.62.18.31.8 1.32 1.72 2.14 1.18 1.05 2.18 1.38 2.49 1.53.31.15.49.13.67-.08.18-.21.78-.91.99-1.22.21-.31.42-.26.71-.15.29.1.84 1.83 2.16.23.12.39.18.45.28.06.09.06.54-.18 1.22z" />
    </svg>
  )
}

export function ChatWidget() {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [hasUnread, setHasUnread] = useState(true)
  const [activeTab, setActiveTab] = useState<"ai" | "whatsapp">("ai")
  
  // AI Bot state
  const [inputVal, setInputVal] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  
  // WhatsApp Direct State
  const [visitorName, setVisitorName] = useState("")
  const [visitorContact, setVisitorContact] = useState("")
  const [waInputVal, setWaInputVal] = useState("")
  const [showIdentityInputs, setShowIdentityInputs] = useState(false)
  const [waMessages, setWaMessages] = useState<WhatsAppChatMessage[]>([
    {
      id: "wa-intro-1",
      sender: "owner",
      text: "👋 Hi! You can message us directly on WhatsApp right from here.\n\nHave questions about Seat Booking restaurant software, onboarding, 2D floor plans, or pricing? Message us and we'll reply promptly!\n\n*(Note: If you are looking to book a table at a specific restaurant, please contact that restaurant directly).* ",
      time: "Now",
      status: "delivered",
    },
  ])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const waMessagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const waInputRef = useRef<HTMLInputElement>(null)

  // Context detection based on current URL path
  const currentContext: "landing" | "booking" | "dashboard" = location.pathname.includes("/book")
    ? "booking"
    : location.pathname.startsWith("/dashboard") ||
        location.pathname.startsWith("/floor-plan") ||
        location.pathname.startsWith("/reservations")
      ? "dashboard"
      : "landing"

  const getInitialWelcomeMessage = (): Message => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    if (currentContext === "booking") {
      return {
        id: "welcome-booking",
        sender: "bot",
        text: "👋 Welcome to our online reservation concierge! Need help picking a table, party size, or checking dietary accommodations?",
        timestamp: time,
        actions: [
          { label: "Browse Available Tables", url: "/book" },
          { label: "View Floor Plan", url: "/floor-plan" },
        ],
        followUps: ["Do you accept walk-ins?", "What is the dress code?", "Can I request a patio table?"],
      }
    }

    if (currentContext === "dashboard") {
      return {
        id: "welcome-dash",
        sender: "bot",
        text: "👋 Hi Host! I'm your Seat Booking Concierge. Ask me anything about floor layout setup, seating timelines, or guest notes.",
        timestamp: time,
        actions: [
          { label: "Floor Plan Builder", url: "/floor-plan" },
          { label: "View Bookings", url: "/reservations" },
        ],
        followUps: ["How do conflict checks work?", "How do I print today's seating list?"],
      }
    }

    return {
      id: "welcome-landing",
      sender: "bot",
      text: "👋 Hi there! I'm the **Seat Booking AI Assistant**.\n\nLooking to upgrade your restaurant's reservations and 2D floor plans? Ask me anything or explore quick options below!",
      timestamp: time,
      actions: [
        { label: "🚀 Start Free 14-Day Trial", url: "/signup" },
        { label: "🎥 Live Interactive Demo", url: "/#demo" },
        { label: "💳 View Pricing Plans", url: "/#pricing" },
      ],
      followUps: [
        "How much does Seat Booking cost?",
        "How does the 2D floor plan work?",
        "What features are included?",
      ],
    }
  }

  const [messages, setMessages] = useState<Message[]>([getInitialWelcomeMessage()])

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      if (activeTab === "ai") {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      } else {
        waMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }
    }
  }, [messages, waMessages, isTyping, isOpen, activeTab])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setHasUnread(false)
      if (activeTab === "ai") {
        setTimeout(() => inputRef.current?.focus(), 150)
      } else {
        setTimeout(() => waInputRef.current?.focus(), 150)
      }
    }
  }, [isOpen, activeTab])

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputVal).trim()
    if (!text || isTyping) return

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: now,
    }

    setMessages((prev) => [...prev, userMsg])
    setInputVal("")
    setIsTyping(true)

    // Simulate conversational intelligence thinking
    const botResponse = matchChatQuery(text, currentContext)
    const typingDuration = Math.min(1200, Math.max(500, text.length * 20))

    setTimeout(() => {
      setIsTyping(false)
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: botResponse.message,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actions: botResponse.actions,
        followUps: botResponse.followUps,
      }
      setMessages((prev) => [...prev, botMsg])
    }, typingDuration)
  }

  const handleResetChat = () => {
    setMessages([getInitialWelcomeMessage()])
  }

  // Send message directly to owner's WhatsApp
  const handleSendWhatsApp = (textToSend?: string) => {
    const text = (textToSend || waInputVal).trim()
    if (!text) return

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    const userMsg: WhatsAppChatMessage = {
      id: `wa-msg-${Date.now()}`,
      sender: "visitor",
      text,
      time: now,
      status: "delivered",
    }

    setWaMessages((prev) => [...prev, userMsg])
    setWaInputVal("")

    // Format clean WhatsApp message for owner
    const formattedText =
      `👋 *New Message from Seat Booking Visitor*\n\n` +
      (visitorName.trim() ? `👤 *Name:* ${visitorName.trim()}\n` : "") +
      (visitorContact.trim() ? `📱 *Contact:* ${visitorContact.trim()}\n` : "") +
      `📍 *Page:* ${window.location.href}\n\n` +
      `💬 *Message:*\n${text}`

    const targetNumber = OWNER_WHATSAPP_NUMBER.replace(/[^0-9]/g, "")
    const waUrl = `https://api.whatsapp.com/send?phone=${targetNumber}&text=${encodeURIComponent(formattedText)}`

    // Log to backend endpoint
    fetch("/api/chat/whatsapp-inquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: visitorName.trim() || undefined,
        phone: visitorContact.trim() || undefined,
        message: text,
        pageUrl: window.location.href,
      }),
    }).catch(() => {})

    // Open WhatsApp directly in new window/app
    window.open(waUrl, "_blank", "noopener,noreferrer")
  }

  // Format simple markdown into bold and lines
  const renderFormattedText = (raw: string) => {
    const paragraphs = raw.split("\n\n")
    return paragraphs.map((para, pIdx) => {
      const lines = para.split("\n")
      return (
        <p key={pIdx} className={pIdx > 0 ? "mt-2" : ""}>
          {lines.map((line, lIdx) => {
            const isBullet = line.trim().startsWith("•") || line.trim().startsWith("-")
            const cleanLine = isBullet ? line.replace(/^[•-]\s*/, "") : line
            const parts = cleanLine.split(/(\*\*.*?\*\*)/g)

            return (
              <span key={lIdx} className={isBullet ? "flex items-start gap-1.5 ml-1 my-0.5" : "block"}>
                {isBullet && <span className="text-primary font-bold">•</span>}
                <span>
                  {parts.map((part, partIdx) => {
                    if (part.startsWith("**") && part.endsWith("**")) {
                      return <strong key={partIdx} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
                    }
                    if (part.startsWith("*") && part.endsWith("*")) {
                      return <em key={partIdx} className="italic">{part.slice(1, -1)}</em>
                    }
                    if (part.startsWith("`") && part.endsWith("`")) {
                      return (
                        <code key={partIdx} className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                          {part.slice(1, -1)}
                        </code>
                      )
                    }
                    return part
                  })}
                </span>
              </span>
            )
          })}
        </p>
      )
    })
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end print:hidden">
      {/* ------------------------------------------------------------- */}
      {/* CHAT WINDOW MODAL                                              */}
      {/* ------------------------------------------------------------- */}
      {isOpen && (
        <div className="relative mb-3 flex h-[580px] max-h-[85vh] w-[360px] sm:w-[410px] flex-col overflow-hidden rounded-2xl border bg-background/95 shadow-2xl backdrop-blur-xl transition-all duration-300 animate-in fade-in-50 slide-in-from-bottom-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b bg-muted/60 px-4 py-2.5">
            <div className="flex items-center gap-2.5">
              <div
                className={`relative flex size-9 items-center justify-center rounded-xl shadow-xs transition-colors ${
                  activeTab === "whatsapp" ? "bg-emerald-600 text-white" : "bg-primary text-primary-foreground"
                }`}
              >
                {activeTab === "ai" ? (
                  <Bot className="size-5" />
                ) : (
                  <WhatsAppIcon className="size-5 fill-current" />
                )}
                <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background bg-emerald-500" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold leading-tight">
                    {activeTab === "ai" ? "Seat Booking Assistant" : "Chat on WhatsApp"}
                  </h4>
                  <Badge
                    variant="secondary"
                    className={`h-4 text-[10px] px-1 font-semibold ${
                      activeTab === "whatsapp" ? "bg-emerald-600/15 text-emerald-600 dark:text-emerald-400" : ""
                    }`}
                  >
                    {activeTab === "ai" ? "AI BOT" : "DIRECT TO OWNER"}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  {activeTab === "ai" ? (
                    "Always active • Instant response"
                  ) : (
                    <>
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{OWNER_DISPLAY_PHONE} • Direct chat</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {activeTab === "ai" && (
                <button
                  onClick={handleResetChat}
                  title="Restart conversation"
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
                >
                  <RotateCcw className="size-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                title="Minimize chat"
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
              >
                <ChevronDown className="size-4" />
              </button>
            </div>
          </div>

          {/* ----------------------------------------------------------- */}
          {/* INTERFACE SWITCHER TABS                                     */}
          {/* ----------------------------------------------------------- */}
          <div className="grid grid-cols-2 p-1.5 bg-muted/40 border-b gap-1.5">
            <button
              onClick={() => setActiveTab("ai")}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "ai"
                  ? "bg-background text-foreground shadow-xs border"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              <Bot className="size-3.5 text-primary" />
              <span>AI Assistant</span>
            </button>

            <button
              onClick={() => setActiveTab("whatsapp")}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "whatsapp"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10"
              }`}
            >
              <WhatsAppIcon className="size-3.5 fill-current" />
              <span>WhatsApp Direct</span>
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>
          </div>

          {/* ----------------------------------------------------------- */}
          {/* VIEW A: AI ASSISTANT FEED                                    */}
          {/* ----------------------------------------------------------- */}
          {activeTab === "ai" ? (
            <>
              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {msg.sender === "bot" ? (
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                        <Bot className="size-4" />
                      </div>
                    ) : (
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <User className="size-4" />
                      </div>
                    )}

                    <div className={`flex flex-col gap-1 max-w-[82%] ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                      <div
                        className={`rounded-2xl px-3.5 py-2.5 text-left leading-relaxed shadow-xs ${
                          msg.sender === "user"
                            ? "bg-primary text-primary-foreground rounded-tr-xs"
                            : "bg-muted/70 text-foreground border rounded-tl-xs"
                        }`}
                      >
                        {renderFormattedText(msg.text)}

                        {/* Action buttons (if provided) */}
                        {msg.actions && msg.actions.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border/40 pt-2.5">
                            {msg.actions.map((act) => {
                              const isExternal = act.url?.startsWith("http")
                              const isWhatsApp = act.url?.includes("wa.me")

                              return isExternal ? (
                                <Button
                                  key={act.label}
                                  size="sm"
                                  variant={isWhatsApp ? "default" : "secondary"}
                                  className={`h-7 px-2.5 text-[11px] font-semibold gap-1.5 hover:scale-102 transition-all ${
                                    isWhatsApp
                                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                                      : ""
                                  }`}
                                  asChild
                                >
                                  <a href={act.url} target="_blank" rel="noopener noreferrer">
                                    {isWhatsApp && <WhatsAppIcon className="size-3.5 fill-current" />}
                                    {act.label}
                                    <ArrowRight className="size-3" />
                                  </a>
                                </Button>
                              ) : (
                                <Button
                                  key={act.label}
                                  size="sm"
                                  variant="secondary"
                                  className="h-7 px-2.5 text-[11px] font-semibold gap-1 hover:scale-102 transition-all"
                                  asChild
                                >
                                  <Link to={act.url || "#"} onClick={() => setIsOpen(false)}>
                                    {act.label}
                                    <ArrowRight className="size-3" />
                                  </Link>
                                </Button>
                              )
                            })}
                          </div>
                        )}
                      </div>

                      <span className="text-[10px] text-muted-foreground px-1">{msg.timestamp}</span>

                      {/* Follow-up suggestions */}
                      {msg.followUps && msg.followUps.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {msg.followUps.map((prompt) => (
                            <button
                              key={prompt}
                              onClick={() => handleSend(prompt)}
                              className="rounded-full border bg-background/80 px-2.5 py-1 text-[11px] text-muted-foreground hover:border-primary/50 hover:bg-accent hover:text-foreground transition-all cursor-pointer text-left"
                            >
                              💬 {prompt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                      <Bot className="size-4" />
                    </div>
                    <div className="flex items-center gap-1 rounded-2xl border bg-muted/60 px-3.5 py-2">
                      <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                      <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                      <span className="size-1.5 rounded-full bg-primary animate-bounce" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Topics Pill Bar */}
              <div className="flex gap-1 overflow-x-auto border-t bg-muted/30 px-3 py-1.5 no-scrollbar text-[11px]">
                {["Pricing", "Floor Plan", "Online Bookings", "14-Day Free Trial"].map((topic) => (
                  <button
                    key={topic}
                    onClick={() => handleSend(topic)}
                    className="shrink-0 rounded-md bg-background px-2 py-0.5 border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
                  >
                    {topic}
                  </button>
                ))}
              </div>

              {/* Input Footer */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSend()
                }}
                className="flex items-center gap-2 border-t bg-background p-3"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="Ask anything about Seat Booking..."
                  className="flex-1 rounded-xl border bg-muted/40 px-3 py-2 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!inputVal.trim() || isTyping}
                  className="size-8 p-0 rounded-xl shrink-0"
                >
                  <Send className="size-3.5" />
                </Button>
              </form>
            </>
          ) : (
            /* --------------------------------------------------------- */
            /* VIEW B: DIRECT WHATSAPP CHAT THREAD                       */
            /* --------------------------------------------------------- */
            <div className="flex flex-1 flex-col justify-between overflow-hidden bg-slate-50 dark:bg-zinc-950/60">
              {/* Software Platform Notice Banner */}
              <div className="bg-amber-500/10 border-b border-amber-500/20 px-3 py-1.5 text-[10px] text-amber-800 dark:text-amber-300 leading-tight">
                ℹ️ <strong>Platform Notice:</strong> This chat is for Seat Booking software support & sales. To book a table, customers must contact the specific restaurant directly.
              </div>

              {/* Optional Identity Bar Toggle */}
              <div className="border-b bg-muted/30 px-3 py-1.5 text-[11px] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowIdentityInputs((v) => !v)}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer font-medium"
                >
                  <UserCheck className="size-3.5 text-emerald-600" />
                  <span>
                    {visitorName || visitorContact
                      ? `Messaging as: ${visitorName || "Guest"} ${visitorContact ? `(${visitorContact})` : ""}`
                      : "Add your Name & Phone (Optional)"}
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold underline ml-1">
                    {showIdentityInputs ? "Hide" : "Edit"}
                  </span>
                </button>
                <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                  Direct Line
                </Badge>
              </div>

              {/* Collapsible Identity Inputs */}
              {showIdentityInputs && (
                <div className="grid grid-cols-2 gap-2 p-2.5 bg-background border-b animate-in fade-in-50 text-xs">
                  <div>
                    <label className="text-[10px] text-muted-foreground font-semibold">Your Name:</label>
                    <input
                      type="text"
                      value={visitorName}
                      onChange={(e) => setVisitorName(e.target.value)}
                      placeholder="e.g. Sarah"
                      className="mt-0.5 w-full rounded-lg border bg-muted/40 px-2 py-1 text-xs outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground font-semibold">Your Phone / Email:</label>
                    <input
                      type="text"
                      value={visitorContact}
                      onChange={(e) => setVisitorContact(e.target.value)}
                      placeholder="e.g. +1 555 123 4567"
                      className="mt-0.5 w-full rounded-lg border bg-muted/40 px-2 py-1 text-xs outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* WhatsApp Messages Feed */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs">
                {waMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${msg.sender === "visitor" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.sender === "owner" && (
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                        <WhatsAppIcon className="size-3.5 fill-current" />
                      </div>
                    )}

                    <div
                      className={`relative max-w-[85%] rounded-2xl px-3.5 py-2.5 text-left leading-relaxed shadow-xs ${
                        msg.sender === "visitor"
                          ? "bg-emerald-600 text-white rounded-tr-xs"
                          : "bg-background border text-foreground rounded-tl-xs"
                      }`}
                    >
                      <p className="whitespace-pre-line text-xs">{msg.text}</p>
                      
                      <div
                        className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                          msg.sender === "visitor" ? "text-emerald-100" : "text-muted-foreground"
                        }`}
                      >
                        <span>{msg.time}</span>
                        {msg.sender === "visitor" && (
                          <span title="Delivered to WhatsApp" className="flex items-center">
                            <CheckCheck className="size-3 text-emerald-200" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <div ref={waMessagesEndRef} />
              </div>

              {/* Quick Inquiry Chips */}
              <div className="flex gap-1 overflow-x-auto border-t bg-muted/20 px-2.5 py-1.5 no-scrollbar text-[11px]">
                {[
                  { label: "💳 Pricing & Plans", text: "Hi! I'd like more information about Seat Booking pricing and features for my restaurant." },
                  { label: "📐 2D Floor Plan Setup", text: "Hi! Can you help me set up a custom 2D floor plan layout for my venue?" },
                  { label: "🚀 Restaurant Onboarding", text: "Hi! I'm interested in onboarding my restaurant onto Seat Booking." },
                  { label: "💬 Software Inquiries", text: "Hi Seat Booking! I have a question about your restaurant management platform." },
                ].map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => handleSendWhatsApp(chip.text)}
                    className="shrink-0 rounded-full border border-emerald-500/30 bg-background/90 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer shadow-xs"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* WhatsApp Direct Input Footer */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSendWhatsApp()
                }}
                className="flex items-center gap-2 border-t bg-background p-2.5"
              >
                <input
                  ref={waInputRef}
                  type="text"
                  value={waInputVal}
                  onChange={(e) => setWaInputVal(e.target.value)}
                  placeholder="Ask about Seat Booking software or onboarding..."
                  className="flex-1 rounded-xl border bg-muted/40 px-3 py-2 text-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-foreground"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!waInputVal.trim()}
                  className="size-8 p-0 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-md cursor-pointer transition-all hover:scale-105"
                >
                  <Send className="size-3.5" />
                </Button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* FLOATING TRIGGER BUTTON                                        */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center gap-2">
        {/* Unread Teaser Bubble (when collapsed) */}
        {!isOpen && hasUnread && (
          <div
            onClick={() => setIsOpen(true)}
            className="hidden sm:flex items-center gap-2 rounded-full border bg-background/95 px-3.5 py-1.5 text-xs font-medium shadow-lg backdrop-blur-md cursor-pointer hover:scale-105 transition-all animate-fade-in-up"
          >
            <WhatsAppIcon className="size-3.5 text-emerald-600 fill-current animate-pulse" />
            <span>Chat with us on WhatsApp or AI</span>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close AI Chatbot" : "Open AI Chatbot"}
          className={`relative flex size-13 items-center justify-center rounded-full shadow-2xl transition-all duration-300 cursor-pointer ${
            isOpen
              ? "bg-muted text-foreground rotate-90 scale-95"
              : "bg-primary text-primary-foreground hover:scale-108 hover:shadow-primary/25"
          }`}
        >
          {isOpen ? (
            <X className="size-6" />
          ) : (
            <>
              <MessageSquare className="size-6" />
              {hasUnread && (
                <span className="absolute -top-1 -right-1 flex size-3.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-3.5 rounded-full bg-emerald-500 border-2 border-background" />
                </span>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
