import { createDomainApiService } from "@/services/domain-api";
import type { ApiResult } from "@/services/http";

export type ChatThread = {
  id: string;
  orderId?: string | null;
  subject?: string | null;
  lastMessagePreview?: string | null;
};

export type ChatMessage = {
  id: string;
  body: string;
  senderType?: "CUSTOMER" | "SUPPORT" | string;
  createdAt: string;
};

export type ChatMessageCreatedEvent = {
  message: ChatMessage;
  threadId: string;
};

export type CreateChatThreadPayload = {
  message: string;
  subject: string;
  orderId?: string;
};

export type SendChatMessagePayload = {
  message: string;
};

const chatService = createDomainApiService();

export const getChat = chatService.get;
export const postChat = chatService.post;
export const patchChat = chatService.patch;
export const deleteChat = chatService.del;

const getRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

const normalizeThreadList = (response: ApiResult): ChatThread[] => {
  if (Array.isArray(response.data)) return response.data as ChatThread[];

  const data = getRecord(response.data);
  if (Array.isArray(data?.data)) return data.data as ChatThread[];
  if (Array.isArray(data?.items)) return data.items as ChatThread[];

  return [];
};

export const createChatThread = async ({
  payload,
  token,
}: {
  payload: CreateChatThreadPayload;
  token?: string | null;
}) => {
  const response = await postChat("/v1/chat/threads", payload, token);

  return {
    response,
    thread: response?.success ? response.data as ChatThread : null,
  };
};

export const fetchChatThreads = async (token?: string | null) => {
  const response = await getChat("/v1/chat/threads", token);

  return {
    response,
    threads: response?.success ? normalizeThreadList(response) : [],
  };
};

export const fetchChatThreadMessages = async ({
  threadId,
  token,
}: {
  threadId: string;
  token?: string | null;
}) => {
  const response = await getChat(`/v1/chat/threads/${threadId}`, token);
  const data = getRecord(response.data);

  return {
    response,
    messages: response?.success && Array.isArray(data?.messages) ? data.messages as ChatMessage[] : [],
  };
};

export const sendChatMessage = ({
  threadId,
  payload,
  token,
}: {
  threadId: string;
  payload: SendChatMessagePayload;
  token?: string | null;
}) => postChat(`/v1/chat/threads/${threadId}/messages`, payload, token);
